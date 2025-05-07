import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

// I should change this so it isn't flask specfic.
// Typically I run my backend with netlify dev which pulls my env vars from their service.
dotenv.config({ path: "../.flaskenv" });

export const TASK_QUEUE_NAME = "shy-party";
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
export const twilioPhoneNumber = process.env.TWILIO_FROM_Number;
