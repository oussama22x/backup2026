import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Mail, Lock } from "lucide-react";
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
export default function SignupFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleEmailNext = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse({
        email
      });
      setStep(2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Email",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    }
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      passwordSchema.parse({
        password,
        confirmPassword
      });
      const redirectUrl = `${window.location.origin}/talent/profile/wizard`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else if (data.user) {
        // Note: app_user record is automatically created by database trigger
        // No need to manually insert - the trigger handles it

        toast({
          title: "Account Created!",
          description: "Let's complete your profile."
        });
        navigate("/talent/profile/wizard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Password",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.3
    }} className="w-full max-w-md">
      <Card>
        <CardHeader>
          {location.state?.from === 'job-application' && location.state?.jobTitle && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                📋 Applying for: <span className="font-semibold">{location.state.jobTitle}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete your profile to submit your application
              </p>
            </div>
          )}
          <CardTitle>Find Your Next Opportunity</CardTitle>
          <CardDescription>
            {step === 1 ? "Enter your email to get started" : "Choose a secure password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? <form onSubmit={handleEmailNext} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/auth")}>
                Back to Sign In
              </Button>
              <Button type="submit" className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form> : <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "Creating Account..." : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>}
        </CardContent>
      </Card>
    </motion.div>
  </div>;
}