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

This will spin up a live version of the site to play with styling. Since it's a static site you'll need to actually freeze the website. You can do this with. 
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
