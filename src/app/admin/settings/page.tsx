
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
import { Settings, Save, Loader2, KeyRound, UserSquare, Store, ShieldAlert } from 'lucide-react';
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
                // Merge fetched settings with initial settings to ensure all keys are present
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
            const settingsDocRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(settingsDocRef, settings, { merge: true });
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
                    管理應用程式的各項設定，例如支付方式的商家帳戶資訊。
                </p>
            </div>

            <Alert variant="destructive" className="bg-red-600/10 border-red-600/50 text-red-800 dark:text-red-300">
                <ShieldAlert className="h-5 w-5 !text-red-600 dark:!text-red-400" />
                <AlertTitle className="font-bold text-lg">極度重要安全警告：僅供演示，切勿輸入真實密鑰！</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                   <p>此頁面僅用於**原型演示和API結構展示**。此處輸入的任何內容都將儲存在客戶端可讀取的 Firestore 資料庫中，這對於真實的 API 金鑰或密碼來說是**極不安全**的。</p>
                   <p>在真實的生產環境中，敏感金鑰**必須**透過安全的後端服務（如 Firebase Cloud Functions）並使用環境變數進行管理，絕不能暴露在前端或客戶端可訪問的資料庫中。</p>
                </AlertDescription>
            </Alert>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary">支付平台設定 (僅供模擬)</CardTitle>
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

                        {Object.keys(settings).map((platformKey) => {
                             const platform = platformKey as keyof AllPaymentSettings;
                             return (
                                <TabsContent key={platform} value={platform} className="pt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="capitalize font-headline text-xl">{platform}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
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
                    {isSaving ? "儲存中..." : "儲存所有設定"}
                </Button>
            </div>
        </div>
    );
}

    