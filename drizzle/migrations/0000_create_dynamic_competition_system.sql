CREATE TABLE public.judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  experience text NOT NULL,
  image_key text NOT NULL,
  intro_video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.judges TO anon, authenticated;
GRANT ALL ON public.judges TO service_role;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published judges are public" ON public.judges FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  format_label text NOT NULL,
  certificate_enabled boolean NOT NULL DEFAULT false,
  prize_pool_paise integer NOT NULL DEFAULT 0 CHECK (prize_pool_paise >= 0),
  entry_fee_paise integer NOT NULL DEFAULT 0 CHECK (entry_fee_paise >= 0),
  currency text NOT NULL DEFAULT 'INR',
  capacity integer NOT NULL CHECK (capacity > 0),
  booked_count integer NOT NULL DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= capacity),
  registration_opens_at timestamptz NOT NULL,
  registration_closes_at timestamptz NOT NULL,
  submission_opens_at timestamptz NOT NULL,
  submission_closes_at timestamptz NOT NULL,
  results_at timestamptz NOT NULL,
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','cancelled','archived')),
  judge_id uuid REFERENCES public.judges(id) ON DELETE SET NULL,
  about text NOT NULL,
  judging_parameters text NOT NULL,
  rules_eligibility text NOT NULL,
  disclaimer text NOT NULL,
  referral_reward_paise integer NOT NULL DEFAULT 0 CHECK (referral_reward_paise >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (registration_opens_at < registration_closes_at),
  CHECK (submission_opens_at < submission_closes_at),
  CHECK (registration_opens_at <= submission_closes_at),
  CHECK (submission_closes_at <= results_at)
);
GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published competitions are public" ON public.competitions FOR SELECT TO anon, authenticated USING (publication_status IN ('published','cancelled','archived'));

CREATE TABLE public.competition_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank > 0),
  label text NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  icon text NOT NULL DEFAULT 'star',
  UNIQUE (competition_id, rank)
);
GRANT SELECT ON public.competition_rewards TO anon, authenticated;
GRANT ALL ON public.competition_rewards TO service_role;
ALTER TABLE public.competition_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards for public competitions are public" ON public.competition_rewards FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_id AND c.publication_status IN ('published','cancelled','archived')));

CREATE TABLE public.competition_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  display_name text NOT NULL,
  placement_label text NOT NULL,
  image_key text NOT NULL,
  video_url text,
  published boolean NOT NULL DEFAULT false,
  UNIQUE (competition_id, display_order)
);
GRANT SELECT ON public.competition_winners TO anon, authenticated;
GRANT ALL ON public.competition_winners TO service_role;
ALTER TABLE public.competition_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published winners are public" ON public.competition_winners FOR SELECT TO anon, authenticated USING (published AND EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_id AND c.publication_status IN ('published','archived')));

CREATE TABLE public.competition_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  payment_status text NOT NULL DEFAULT 'waived' CHECK (payment_status IN ('pending','paid','waived','refunded')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);
GRANT SELECT ON public.competition_registrations TO authenticated;
GRANT ALL ON public.competition_registrations TO service_role;
ALTER TABLE public.competition_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own registrations" ON public.competition_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  media_url text NOT NULL CHECK (length(media_url) BETWEEN 8 AND 2048),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','accepted','disqualified','withdrawn')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_id)
);
GRANT SELECT ON public.competition_submissions TO authenticated;
GRANT ALL ON public.competition_submissions TO service_role;
ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own submissions" ON public.competition_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX competition_registrations_competition_status_idx ON public.competition_registrations (competition_id, status);
CREATE INDEX competition_submissions_competition_status_idx ON public.competition_submissions (competition_id, status);
CREATE INDEX competition_rewards_competition_rank_idx ON public.competition_rewards (competition_id, rank);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER competitions_touch_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER registrations_touch_updated_at BEFORE UPDATE ON public.competition_registrations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER submissions_touch_updated_at BEFORE UPDATE ON public.competition_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.register_for_competition(_competition_id uuid)
RETURNS public.competition_registrations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id uuid := auth.uid();
  _competition public.competitions;
  _registration public.competition_registrations;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO _competition FROM public.competitions WHERE id = _competition_id FOR UPDATE;
  IF NOT FOUND OR _competition.publication_status <> 'published' THEN RAISE EXCEPTION 'COMPETITION_UNAVAILABLE' USING ERRCODE = 'P0001'; END IF;
  IF now() < _competition.registration_opens_at THEN RAISE EXCEPTION 'REGISTRATION_NOT_OPEN' USING ERRCODE = 'P0001'; END IF;
  IF now() >= _competition.registration_closes_at THEN RAISE EXCEPTION 'REGISTRATION_CLOSED' USING ERRCODE = 'P0001'; END IF;
  IF _competition.booked_count >= _competition.capacity THEN RAISE EXCEPTION 'COMPETITION_FULL' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO _registration FROM public.competition_registrations WHERE competition_id = _competition_id AND user_id = _user_id;
  IF FOUND AND _registration.status = 'confirmed' THEN RETURN _registration; END IF;
  IF FOUND THEN
    UPDATE public.competition_registrations SET status = 'confirmed', payment_status = CASE WHEN _competition.entry_fee_paise = 0 THEN 'waived' ELSE 'pending' END, cancelled_at = NULL
    WHERE id = _registration.id RETURNING * INTO _registration;
  ELSE
    INSERT INTO public.competition_registrations (competition_id, user_id, payment_status)
    VALUES (_competition_id, _user_id, CASE WHEN _competition.entry_fee_paise = 0 THEN 'waived' ELSE 'pending' END)
    RETURNING * INTO _registration;
  END IF;
  UPDATE public.competitions SET booked_count = booked_count + 1 WHERE id = _competition_id;
  RETURN _registration;
END;
$$;
REVOKE ALL ON FUNCTION public.register_for_competition(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_competition(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_from_competition(_competition_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid := auth.uid(); _changed integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  PERFORM 1 FROM public.competitions WHERE id = _competition_id FOR UPDATE;
  UPDATE public.competition_registrations SET status = 'cancelled', cancelled_at = now()
  WHERE competition_id = _competition_id AND user_id = _user_id AND status = 'confirmed';
  GET DIAGNOSTICS _changed = ROW_COUNT;
  IF _changed > 0 THEN UPDATE public.competitions SET booked_count = GREATEST(booked_count - 1, 0) WHERE id = _competition_id; END IF;
  RETURN _changed > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.withdraw_from_competition(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_from_competition(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_competition_entry(_competition_id uuid, _media_url text)
RETURNS public.competition_submissions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid := auth.uid(); _competition public.competitions; _registration public.competition_registrations; _submission public.competition_submissions;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  IF _media_url IS NULL OR length(trim(_media_url)) < 8 OR length(_media_url) > 2048 THEN RAISE EXCEPTION 'INVALID_MEDIA_URL' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO _competition FROM public.competitions WHERE id = _competition_id;
  IF NOT FOUND OR _competition.publication_status <> 'published' THEN RAISE EXCEPTION 'COMPETITION_UNAVAILABLE' USING ERRCODE = 'P0001'; END IF;
  IF now() < _competition.submission_opens_at THEN RAISE EXCEPTION 'SUBMISSIONS_NOT_OPEN' USING ERRCODE = 'P0001'; END IF;
  IF now() >= _competition.submission_closes_at THEN RAISE EXCEPTION 'SUBMISSIONS_CLOSED' USING ERRCODE = 'P0001'; END IF;
  SELECT * INTO _registration FROM public.competition_registrations WHERE competition_id = _competition_id AND user_id = _user_id AND status = 'confirmed';
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  IF _registration.payment_status NOT IN ('paid','waived') THEN RAISE EXCEPTION 'PAYMENT_REQUIRED' USING ERRCODE = 'P0001'; END IF;
  INSERT INTO public.competition_submissions (competition_id, registration_id, user_id, media_url)
  VALUES (_competition_id, _registration.id, _user_id, trim(_media_url))
  ON CONFLICT (registration_id) DO UPDATE SET media_url = EXCLUDED.media_url, status = 'submitted', submitted_at = now()
  RETURNING * INTO _submission;
  RETURN _submission;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_competition_entry(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_competition_entry(uuid,text) TO authenticated;

WITH j AS (
  INSERT INTO public.judges (name,title,experience,image_key) VALUES ('Manju Dubey','Professional Kathak Dancer','12+ Years of Experience','judge-manju') RETURNING id
), c AS (
  INSERT INTO public.competitions (slug,title,category,format_label,certificate_enabled,prize_pool_paise,entry_fee_paise,capacity,registration_opens_at,registration_closes_at,submission_opens_at,submission_closes_at,results_at,publication_status,judge_id,about,judging_parameters,rules_eligibility,disclaimer,referral_reward_paise)
  SELECT 'feedants-classical-dance','Feedants Classical Dance','Dance','Multi-Win',true,150000,0,20,now()-interval '7 days',now()+interval '1 day',now()-interval '3 days',now()+interval '20 days',now()+interval '22 days','published',id,'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.','Performances are judged on technique, expression, rhythm and presentation.','Participants of all ages may enter with one original, self-recorded performance.','Only contributions from registered participants will be considered for judging.',1000 FROM j RETURNING id
), r AS (
  INSERT INTO public.competition_rewards (competition_id,rank,label,amount_paise,icon)
  SELECT c.id,v.rank,v.label,v.amount,v.icon FROM c CROSS JOIN (VALUES (1,'1st Winner',55000,'trophy'),(2,'2nd Winner',30000,'medal'),(3,'3rd Winner',24000,'medal'),(4,'4th Winner',20000,'star'),(5,'5th Winner',13000,'star'),(6,'6th Winner',8000,'star')) AS v(rank,label,amount,icon)
)
INSERT INTO public.competition_winners (competition_id,display_order,display_name,placement_label,image_key,published)
SELECT c.id,v.ord,v.name,v.place,v.image_key,true FROM c CROSS JOIN (VALUES (1,'Riya Shah','1st Winner','winner-riya'),(2,'Aarav Mehta','1st Winner','winner-aarav'),(3,'Neha Verma','2nd Winner','winner-neha'),(4,'Ishita Chopra','3rd Winner','winner-riya')) AS v(ord,name,place,image_key);