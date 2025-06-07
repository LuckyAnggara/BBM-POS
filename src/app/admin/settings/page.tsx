
'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bell, Building, Palette, ShieldCheck, Loader2, Percent, Globe, Binary, Milestone } from "lucide-react"; // Added Globe, Binary, Milestone
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAppSettings, saveAppSettings } from './actions';
import type { AppSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/components/layout/page-title-context';


const generalSettingsSchema = z.object({
  appName: z.string().min(1, "Application name is required"),
  dateFormat: z.string(),
  timeZone: z.string(),
  defaultCurrency: z.string().min(3, "Currency code must be 3 letters").max(3, "Currency code must be 3 letters"), // For USD, IDR
  currencySymbol: z.string().max(5, "Symbol too long").optional().nullable(), // For $, Rp
  currencySuffix: z.string().max(5, "Suffix too long").optional().nullable(), // For ,-
  currencyDecimalPlaces: z.coerce.number().int().min(0, "Must be non-negative").max(4, "Max 4 decimal places"),
  defaultTaxRate: z.coerce.number().min(0, "Tax rate must be non-negative").max(100, "Tax rate cannot exceed 100"),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  lowStockAlerts: z.boolean(),
  newOrderAlerts: z.boolean(),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;


export default function SettingsPage() {
  usePageTitle('System Settings');
  const [isPageLoading, setIsPageLoading] = useState(true); 

  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
  });

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
  });

  useEffect(() => {
    async function loadSettings() {
      setIsPageLoading(true); 
      try {
        const settings = await fetchAppSettings();
        generalForm.reset({
          appName: settings.appName,
          dateFormat: settings.dateFormat,
          timeZone: settings.timeZone,
          defaultCurrency: settings.defaultCurrency,
          currencySymbol: settings.currencySymbol,
          currencySuffix: settings.currencySuffix,
          currencyDecimalPlaces: settings.currencyDecimalPlaces,
          defaultTaxRate: settings.defaultTaxRate,
        });
        notificationForm.reset({
          emailNotifications: settings.emailNotifications,
          lowStockAlerts: settings.lowStockAlerts,
          newOrderAlerts: settings.newOrderAlerts,
        });
      } catch (error) {
        toast.error("Failed to load settings.");
        console.error(error);
      } finally {
        setIsPageLoading(false); 
      }
    }
    loadSettings();
  }, [generalForm, notificationForm]); 

  const onGeneralSubmit: SubmitHandler<GeneralSettingsValues> = async (data) => {
    try {
      await saveAppSettings(data);
      toast.success("General settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save general settings.");
    }
  };
  
  const onNotificationSubmit: SubmitHandler<NotificationSettingsValues> = async (data) => {
    try {
      await saveAppSettings(data);
      toast.success("Notification settings saved successfully!");
    } catch (error) {
       toast.error("Failed to save notification settings.");
    }
  };
  
  const isGeneralSubmitting = generalForm.formState.isSubmitting;
  const isNotificationSubmitting = notificationForm.formState.isSubmitting;

  return (
    <Card>
      <CardContent className="pt-6"> 
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="general"><Building className="mr-2 h-4 w-4 inline-block" />General</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4 inline-block" />Notifications</TabsTrigger>
            <TabsTrigger value="appearance" disabled><Palette className="mr-2 h-4 w-4 inline-block" />Appearance</TabsTrigger>
            <TabsTrigger value="security" disabled><ShieldCheck className="mr-2 h-4 w-4 inline-block" />Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Application-wide settings including currency and tax.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPageLoading ? ( 
                  <div className="space-y-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    <Skeleton className="h-10 w-48" />
                  </div>
                ) : (
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="appName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Name</FormLabel>
                          <FormControl>
                            <Input placeholder="StockPilot" {...field} disabled={isGeneralSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                        control={generalForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isGeneralSubmitting}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a date format" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (e.g., 07/25/2024)</SelectItem>
                                <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (e.g., 25/07/2024)</SelectItem>
                                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (e.g., 2024-07-25)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={generalForm.control}
                        name="timeZone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Time Zone</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isGeneralSubmitting}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a time zone" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                                <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    
                    <CardTitle className="text-lg pt-2 border-t">Currency Settings</CardTitle>
                     <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField
                            control={generalForm.control}
                            name="defaultCurrency"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="flex items-center gap-1"><Globe className="h-4 w-4"/>Currency Code</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isGeneralSubmitting}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="USD">USD - United States Dollar</SelectItem>
                                        <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>ISO 4217 code.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={generalForm.control}
                            name="currencySymbol"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="flex items-center gap-1"><Milestone className="h-4 w-4"/>Symbol</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., $ or Rp" {...field} value={field.value ?? ''} disabled={isGeneralSubmitting} />
                                </FormControl>
                                <FormDescription>Prefix symbol.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={generalForm.control}
                            name="currencySuffix"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="flex items-center gap-1"><Milestone className="h-4 w-4 rotate-180"/>Suffix</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., ,-" {...field} value={field.value ?? ''} disabled={isGeneralSubmitting} />
                                </FormControl>
                                 <FormDescription>Text after amount.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={generalForm.control}
                            name="currencyDecimalPlaces"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="flex items-center gap-1"><Binary className="h-4 w-4"/>Decimals</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="2" {...field} disabled={isGeneralSubmitting} />
                                </FormControl>
                                <FormDescription>0 for IDR, 2 for USD.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <CardTitle className="text-lg pt-2 border-t">Tax Settings</CardTitle>
                     <FormField
                      control={generalForm.control}
                      name="defaultTaxRate"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <Input type="number" placeholder="e.g., 10" {...field} className="pr-8" disabled={isGeneralSubmitting} />
                               <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>Set the default sales tax rate (0-100).</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4" disabled={isGeneralSubmitting || isPageLoading}>
                      {isGeneralSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {isGeneralSubmitting ? 'Saving...' : 'Save General Settings'}
                    </Button>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPageLoading ? ( 
                    <div className="space-y-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-56" />
                    </div>
                ) : (
                 <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Enable Email Notifications</FormLabel>
                            <FormDescription>Receive important updates via email.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isNotificationSubmitting} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={notificationForm.control}
                      name="lowStockAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Low Stock Alerts</FormLabel>
                            <FormDescription>Get notified when product stock is low.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isNotificationSubmitting} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="newOrderAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>New Purchase Order Alerts</FormLabel>
                            <FormDescription>Receive alerts for new purchase orders requiring action.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isNotificationSubmitting}/>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4" disabled={isNotificationSubmitting || isPageLoading}>
                       {isNotificationSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                       {isNotificationSubmitting ? 'Saving...' : 'Save Notification Settings'}
                    </Button>
                  </form>
                </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application. (Coming Soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Theme and layout customization options will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security preferences. (Coming Soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Options for two-factor authentication, password policies, etc.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
