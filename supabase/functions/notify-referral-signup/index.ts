import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyReferralRequest {
  referrer_id: string;
  referred_user_name: string;
  referred_user_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { referrer_id, referred_user_name, referred_user_email }: NotifyReferralRequest = await req.json();

    console.log("Notify referral signup:", { referrer_id, referred_user_name, referred_user_email });

    // Get the referrer's profile
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("email, full_name, referral_code")
      .eq("id", referrer_id)
      .single();

    if (referrerError || !referrer) {
      console.error("Failed to fetch referrer profile:", referrerError);
      return new Response(
        JSON.stringify({ error: "Referrer not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending email to referrer:", referrer.email);

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PropWealth AI <onboarding@resend.dev>",
        to: [referrer.email],
        subject: "🎉 New Referral Signup - PropWealth AI",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0e1a; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 New Referral!</h1>
                  <p style="color: #d1fae5; margin: 10px 0 0; font-size: 16px;">Someone signed up using your code</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                  <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Hello <strong style="color: #10b981;">${referrer.full_name || 'Partner'}</strong>! 👋
                  </p>
                  
                  <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    Great news! A new user has signed up on PropWealth AI using your referral code <strong style="color: #10b981;">${referrer.referral_code}</strong>.
                  </p>
                  
                  <!-- New User Info Card -->
                  <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 0 0 25px;">
                    <h3 style="color: #f1f5f9; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">New Referral Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding: 5px 0; width: 80px;">Name:</td>
                        <td style="color: #e2e8f0; font-size: 15px; font-weight: 500;">${referred_user_name || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding: 5px 0;">Email:</td>
                        <td style="color: #e2e8f0; font-size: 15px; font-weight: 500;">${referred_user_email}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    When this user upgrades to a Pro plan, you'll automatically receive your commission! 💰
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="https://propwealth.ai/affiliate" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      View Your Dashboard
                    </a>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #0f172a; padding: 20px; border-top: 1px solid #1e293b; text-align: center;">
                  <p style="color: #64748b; font-size: 13px; margin: 0;">
                    PropWealth AI - Your Global Real Estate Operating System
                  </p>
                  <p style="color: #475569; font-size: 12px; margin: 10px 0 0;">
                    You're receiving this because you're a partner with PropWealth AI.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-referral-signup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
