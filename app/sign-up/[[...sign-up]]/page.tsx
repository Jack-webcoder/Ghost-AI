import { SignUp } from "@clerk/nextjs";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export default function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUp />
    </AuthPageLayout>
  );
}
