
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Loader2, KeyRound, UserSquare, Store, ShieldAlert, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SETTINGS_COLLECTION = 'app_configuration';
const SETTINGS_DOC_ID = 'payment_settings';

type PaymentPlatformSettings = {
    merchantId: string;
    apiKey: string;
    apiSecret: string;
};

type AllPaymentSettings = {
    payme: PaymentPlatformSettings;
    alipayhk: PaymentPlatformSettings;
    wechatpayhk: PaymentPlatformSettings;
    octopus: PaymentPlatformSettings;
};

const initialSettings: AllPaymentSettings = {
    payme: { merchantId: '', apiKey: '', apiSecret: '' },
    alipayhk: { merchantId: '', apiKey: '', apiSecret: '' },
    wechatpayhk: { merchantId: '', apiKey: '', apiSecret: '' },
    octopus: { merchantId: '', apiKey: '', apiSecret: '' },
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<AllPaymentSettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                const fetchedData = docSnap.data();
                const mergedSettings = {
                    ...initialSettings,
                    ...Object.entries(fetchedData).reduce((acc, [key, value]) => {
                        if (key in initialSettings) {
                            acc[key as keyof AllPaymentSettings] = { ...initialSettings[key as keyof AllPaymentSettings], ...value };
                        }
                        return acc;
                    }, {} as Partial<AllPaymentSettings>)
                };
                setSettings(mergedSettings as AllPaymentSettings);
            } else {
                console.log("No payment settings document found. Using initial settings.");
                setSettings(initialSettings);
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
            toast({
                title: "讀取設定失敗",
                description: "讀取支付設定時發生錯誤。",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        document.title = "系統設定 - 智能點餐AI";
        loadSettings();
    }, [loadSettings]);

    const handleInputChange = (platform: keyof AllPaymentSettings, field: keyof PaymentPlatformSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                [field]: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            // We are no longer saving credit card keys here, only other payment methods.
            const { ...otherSettings } = settings;
            const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(settingsDocRef, otherSettings, { merge: true });
            toast({
                title: "設定已儲存",
                description: "您的支付設定已成功更新到資料庫。",
                className: "bg-green-500 text-white border-green-600",
            });
        } catch (error) {
            console.error("Error saving payment settings:", error);
            toast({
                title: "儲存設定失敗",
                description: "儲存支付設定時發生錯誤，請重試。",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">正在載入設定...</p>
          </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-headline font-bold text-primary flex items-center">
                    <Settings className="w-10 h-10 mr-3 text-accent" />
                    系統設定
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                    管理應用程式的各項設定，例如移動支付方式的商戶帳戶資訊。
                </p>
            </div>

            <Alert variant="default" className="bg-blue-600/10 border-blue-600/50 text-blue-800 dark:text-blue-300">
                <Terminal className="h-5 w-5 !text-blue-600 dark:!text-blue-400" />
                <AlertTitle className="font-bold text-lg">信用卡支付設定已轉移</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                   <p>為了提高安全性，Stripe（信用卡）的 API 金鑰現在透過環境變數進行管理，而不是在此頁面輸入。這是真實生產環境中的最佳實踐。</p>
                   <p>請在您的專案根目錄下建立一個 `.env.local` 檔案，並在其中添加您的 Stripe 金鑰：</p>
                   <pre className="text-xs bg-black/10 p-2 rounded-md mt-2 font-mono"><code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...<br/>STRIPE_SECRET_KEY=sk_test_...</code></pre>
                </AlertDescription>
            </Alert>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary">移動支付平台設定 (僅供模擬)</CardTitle>
                    <CardDescription>
                        為不同的移動支付平台配置您的**模擬**商戶帳戶資訊。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="payme" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="payme">PAYME</TabsTrigger>
                            <TabsTrigger value="alipayhk">支付寶HK</TabsTrigger>
                            <TabsTrigger value="wechatpayhk">微信支付HK</TabsTrigger>
                            <TabsTrigger value="octopus">八達通</TabsTrigger>
                        </TabsList>

                        {Object.keys(initialSettings).map((platformKey) => {
                             const platform = platformKey as keyof AllPaymentSettings;
                             return (
                                <TabsContent key={platform} value={platform} className="pt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="capitalize font-headline text-xl">{platform}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Alert variant="destructive">
                                                <ShieldAlert className="h-4 w-4" />
                                                <AlertTitle>僅供演示</AlertTitle>
                                                <AlertDescription>
                                                    請勿在此處輸入真實的生產密鑰。真實密鑰應在安全的後端環境中管理。
                                                </AlertDescription>
                                            </Alert>
                                            <div className="space-y-2">
                                                <Label htmlFor={`${platform}-merchantId`} className="flex items-center"><Store className="w-4 h-4 mr-2"/>商戶ID (Merchant ID)</Label>
                                                <Input id={`${platform}-merchantId`} value={settings[platform].merchantId} onChange={e => handleInputChange(platform, 'merchantId', e.target.value)} placeholder="您的商戶ID (模擬)" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`${platform}-apiKey`} className="flex items-center"><UserSquare className="w-4 h-4 mr-2"/>API 金鑰 (API Key)</Label>
                                                <Input id={`${platform}-apiKey`} value={settings[platform].apiKey} onChange={e => handleInputChange(platform, 'apiKey', e.target.value)} placeholder="您的 API Key (模擬)" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`${platform}-apiSecret`} className="flex items-center"><KeyRound className="w-4 h-4 mr-2"/>API 密鑰 (API Secret)</Label>
                                                <Input id={`${platform}-apiSecret`} type="password" value={settings[platform].apiSecret} onChange={e => handleInputChange(platform, 'apiSecret', e.target.value)} placeholder="您的 API Secret (模擬)" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                             )
                        })}

                    </Tabs>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                    {isSaving ? "儲存中..." : "儲存移動支付設定"}
                </Button>
            </div>
        </div>
    );
}
