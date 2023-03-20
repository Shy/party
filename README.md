# Shy.party

This is a worse version of partiful I use to run events. To deploy this you'll need a PSQL DB. Create an .flaskenv file and add a `DATABASE_URL` to that file.

Install with

```bash
pip install -r requirements.txt
```

Run locally with

```bash
flask run
```

This will spin up a live version of the site to play with styling. I'm using a postgres instance to handle data. You can create the needed tables with:

```psql
CREATE TABLE public.attendee (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  public_id VARCHAR(12) NOT NULL,
  attendee VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  dietary_restrictions VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ ON UPDATE current_timestamp():::TIMESTAMPTZ,
  invited BOOL NOT NULL DEFAULT true,
  CONSTRAINT attendee_pkey PRIMARY KEY (id ASC),
  UNIQUE INDEX attendee_public_id_key (public_id ASC)
)

CREATE TABLE public.attendee (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  public_id VARCHAR(12) NOT NULL,
  attendee VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  dietary_restrictions VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ ON UPDATE current_timestamp():::TIMESTAMPTZ,
  invited BOOL NOT NULL DEFAULT true,
  CONSTRAINT attendee_pkey PRIMARY KEY (id ASC)
)

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  public_id VARCHAR(12) NOT NULL,
  event VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ(6) NOT NULL,
  location VARCHAR(600) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ ON UPDATE current_timestamp():::TIMESTAMPTZ,
  CONSTRAINT events_pkey PRIMARY KEY (id ASC),
  UNIQUE INDEX events_public_id_key (public_id ASC)
)
```

I write sql queries to manage all my admin stuff. Ping me if you want more details.

Since it's a static site you'll need to actually freeze the website now that you have data. You can do this with.
```bash
export DATABASE_URL={whateveryourfulldburlis}
python freeze.py
```


This will create a build directory that will contain all the static files that'll be served out when this is deployed on netlify. Now to debug all the netlify stuff you'll need use the netlify CLI.
Go ahead and run `npm install` to install the netlify cli and axois.

Now to run this website and test out the netlify functions run:

```bash
netlify dev -d app/build/ --debug
```

You'll need to rerun the freeze script anytime you make a change on the flask code. No python actually runs on the server since this is a static site. It just executes at build time.
