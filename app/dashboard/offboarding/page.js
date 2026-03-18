'use client';
import DashboardLayout from '@/components/DashboardLayout';
import OnboardingContent from '@/app/dashboard/onboarding/page'; // We will export the content

export default function OffboardingPage() {
    return <OnboardingContent defaultActiveView="offboarding" />;
}
