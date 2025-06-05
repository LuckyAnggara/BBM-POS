'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Bell, Building, Palette, ShieldCheck } from "lucide-react";
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

const generalSettingsSchema = z.object({
  appName: z.string().min(1, "Application name is required"),
  dateFormat: z.string(),
  timeZone: z.string(),
  defaultCurrency: z.string().length(3, "Currency code must be 3 letters"),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  lowStockAlerts: z.boolean(),
  newOrderAlerts: z.boolean(),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;


export default function SettingsPage() {
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      appName: "StockPilot",
      dateFormat: "MM/dd/yyyy",
      timeZone: "America/New_York",
      defaultCurrency: "USD",
    },
  });

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      lowStockAlerts: true,
      newOrderAlerts: false,
    },
  });

  const onGeneralSubmit: SubmitHandler<GeneralSettingsValues> = (data) => {
    console.log("General Settings Data:", data);
    toast.success("General settings saved successfully!");
  };
  
  const onNotificationSubmit: SubmitHandler<NotificationSettingsValues> = (data) => {
    console.log("Notification Settings Data:", data);
    toast.success("Notification settings saved successfully!");
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">System Settings</CardTitle>
        <CardDescription>Configure application-wide settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
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
                <CardDescription>Basic application settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="appName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Name</FormLabel>
                          <FormControl>
                            <Input placeholder="StockPilot" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time zone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Add more timezones as needed */}
                              <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                              <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="USD" {...field} />
                          </FormControl>
                          <FormDescription>Enter the 3-letter currency code (e.g., USD, EUR).</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4">
                      <Save className="mr-2 h-4 w-4" /> Save General Settings
                    </Button>
                  </form>
                </Form>
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
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4">
                      <Save className="mr-2 h-4 w-4" /> Save Notification Settings
                    </Button>
                  </form>
                </Form>
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
