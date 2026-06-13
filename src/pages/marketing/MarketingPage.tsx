import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketingAnalytics from './MarketingAnalytics';
import SocialLinkGenerator from './SocialLinkGenerator';
import UniversalCampaignManager from './UniversalCampaignManager';
import LandingPageManager from './LandingPageManager';
import PromoCodes from './PromoCodes';
import LeadDashboard from './LeadDashboard';
import ReferralHub from './ReferralHub';

interface MarketingPageProps {
  variant?: 'affiliate' | 'marketing' | 'referrals';
}

export function MarketingPage({ variant = 'marketing' }: MarketingPageProps) {
  const titles = {
    affiliate: 'Affiliate Program',
    marketing: 'Marketing Management Dashboard',
    referrals: 'Referral Hub',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader 
        title={titles[variant]} 
        description="Launch campaigns, generate social trackable links, configure promo codes, and manage incoming leads." 
      />

      <Tabs defaultValue="analytics" className="w-full">
        <div className="overflow-x-auto pb-2 border-b border-border mb-4">
          <TabsList className="flex w-max bg-transparent p-0 gap-2">
            <TabsTrigger 
              value="analytics" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Social Link Generator
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Campaign Manager
            </TabsTrigger>
            <TabsTrigger 
              value="landing" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Landing Pages
            </TabsTrigger>
            <TabsTrigger 
              value="promo" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Promo Codes
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="referrals" 
              className="px-4 py-2 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 rounded-none bg-transparent hover:text-cyan-400"
            >
              Referral Hub
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="mt-2 outline-none">
          <MarketingAnalytics />
        </TabsContent>
        <TabsContent value="social" className="mt-2 outline-none">
          <SocialLinkGenerator />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-2 outline-none">
          <UniversalCampaignManager />
        </TabsContent>
        <TabsContent value="landing" className="mt-2 outline-none">
          <LandingPageManager />
        </TabsContent>
        <TabsContent value="promo" className="mt-2 outline-none">
          <PromoCodes />
        </TabsContent>
        <TabsContent value="leads" className="mt-2 outline-none">
          <LeadDashboard />
        </TabsContent>
        <TabsContent value="referrals" className="mt-2 outline-none">
          <ReferralHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MarketingPage;
