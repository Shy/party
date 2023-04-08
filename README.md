# Shy.party

This is a worse version of partiful I use to run events. To deploy this you'll need a PSQL DB.

## Create SQL Server

I'm using a postgres instance hosted on cockroachdb's serverless free tier to handle data. You can create the needed tables with:

```psql
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  public_id VARCHAR(12) NOT NULL,
  event VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ(6) NOT NULL,
  location VARCHAR(600) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ ON UPDATE current_timestamp():::TIMESTAMPTZ,
  CONSTRAINT events_pkey PRIMARY KEY (id ASC)
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
  CONSTRAINT events_pkey PRIMARY KEY (id ASC)
)

CREATE TABLE public.event_attendee_junction (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  public_id VARCHAR(12) NOT NULL,
  event_id UUID NULL,
  attendee_id UUID NULL,
  rsvp defaultdb.public.rsvp NULL,
  created_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NULL DEFAULT current_timestamp():::TIMESTAMPTZ ON UPDATE current_timestamp():::TIMESTAMPTZ,
  sms_status INT8 NULL DEFAULT 0:::INT8,
  CONSTRAINT event_attendee_junction_pkey PRIMARY KEY (id ASC),
  CONSTRAINT event_attendee_junction_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT event_attendee_junction_attendee_id_fkey FOREIGN KEY (attendee_id) REFERENCES public.attendee(id) ON UPDATE CASCADE
)
```

I write sql queries to manage all my admin stuff. Ping me if you want more details.

## Deploy

You can deploy this repo and just point it at your own DB (formatted with the above instructions). Whenever I push a code update it'll trigger a new build so you'll always have the latest version. I try not to make table updates often to prevent breaking things.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/shy/party#PYTHON_VERSION=3.8&FLASK_APP=shyparty.py)

 You only need to fork this repo if you wanna run it locally.

## Running locally

Save the `.flaskenv.sample` locally as  `.flaskenv` and replace all the creds.

Install with

```bash
pip install -r requirements.txt
```

Run locally with

```bash
flask run
```

This will spin up a live version of the site to play with styling.

Since it's a static site you'll need to actually freeze the website now that you have data. You can do this with.
```bash
python freeze.py
```

This will create a build directory that will contain all the static files that'll be served out when this is deployed on netlify. Now to debug all the netlify stuff you'll need use the netlify CLI.

Go ahead and run `npm install` to install the netlify cli and axois.

Now to run this website and test out the netlify functions run:

```bash
netlify dev -d app/build/ --debug
```

You'll need to rerun the freeze script anytime you make a change on the flask code. No python actually runs on the server since this is a static site. It just executes at build time.
