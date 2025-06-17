
"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, Send, XCircle, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderFormProps {
  onOrderSubmit: (orderText: string) => Promise<void>;
  isProcessing: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderSubmit, isProcessing }) => {
  const [orderText, setOrderText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for SpeechRecognition API support on component mount
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      toast({
        title: "不支持語音輸入",
        description: "您的瀏覽器可能不支持語音識別功能。建議使用最新版本的 Chrome 或 Edge。",
        variant: "destructive",
        duration: 10000,
      });
    }

    return () => {
      // Cleanup: stop recognition if active when component unmounts
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current = null;
      }
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderText.trim()) {
      toast({
        title: "訂單空白",
        description: "請輸入您的訂單詳情。",
        variant: "destructive",
      });
      return;
    }
    await onOrderSubmit(orderText);
  };

  const handleClearInput = () => {
    setOrderText('');
  };

  const handleVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      toast({
        title: "不支持語音輸入",
        description: "您的瀏覽器不支持語音識別功能。",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      // setIsRecording(false); // onend will handle this
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = 'yue-Hant-HK'; // Cantonese (Traditional Chinese, Hong Kong)
    recognition.interimResults = false; // We only want final results
    recognition.continuous = false; // Stops recognizing after a pause in speech

    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "錄音已開始",
        description: "請開始說話...",
      });
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let_transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          _transcript += event.results[i][0].transcript;
        }
      }
      setOrderText(prev => (prev ? prev + ' ' + _transcript : _transcript).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = "語音識別時發生未知錯誤。";
      if (event.error === 'no-speech') {
        errorMessage = "未檢測到語音，請再試一次。";
      } else if (event.error === 'audio-capture') {
        errorMessage = "無法獲取麥克風，請檢查您的麥克風設置和權限。";
      } else if (event.error === 'not-allowed') {
        errorMessage = "麥克風權限被拒絕。請在瀏覽器設定中允許此網站存取您的麥克風。";
      } else if (event.error === 'network') {
        errorMessage = "網絡錯誤導致語音識別失敗，請檢查您的網絡連接。";
      }
      toast({
        title: "語音識別錯誤",
        description: errorMessage,
        variant: "destructive",
      });
      setIsRecording(false); // Ensure UI updates if error occurs before onend
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (recognitionRef.current) { // Check if it wasn't cleaned up by an error
         toast({
           title: "錄音已結束",
           description: "語音已轉換為文字。",
         });
      }
      recognitionRef.current = null; // Allow new instance next time
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting recognition:", e);
      toast({
        title: "啟動錄音失敗",
        description: "無法啟動語音識別功能。請確保麥克風已連接且瀏覽器有權限存取。",
        variant: "destructive",
      });
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current = null;
      }
    }
  };


  return (
    <Card className="w-full shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center">
          <Mic className="w-8 h-8 mr-3 text-accent" />
          開始點餐
        </CardTitle>
        <CardDescription className="text-lg">
          <p>請告訴我們您想點什麼！您可以在下方輸入您的訂單，或使用語音輸入。</p>
          <p>例如：「我想要兩個仙草三號，一份葡撻雞蛋仔和一杯手打香水檸檬茶。」</p>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full gap-4">
            <Textarea
              placeholder="請在此輸入您的訂單..."
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              rows={5}
              className="text-base border-2 border-input focus:border-primary transition-colors duration-300"
              aria-label="Order input"
              disabled={isProcessing}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handleVoiceInput}
                variant="outline"
                className={`w-full sm:flex-1 justify-center group transition-all ${
                  isRecording 
                    ? 'border-destructive text-destructive hover:bg-destructive/10 animate-pulse' 
                    : 'hover:border-primary hover:text-primary'
                }`}
                disabled={isProcessing}
                aria-label={isRecording ? "停止錄音" : "使用語音輸入"}
              >
                {isRecording ? (
                  <StopCircle className="w-5 h-5 mr-2 text-destructive" />
                ) : (
                  <Mic className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                )}
                {isRecording ? '錄音中... 按此停止' : '語音輸入'}
              </Button>
              <Button
                type="button"
                onClick={handleClearInput}
                variant="outline"
                className="w-full sm:flex-1 justify-center group hover:border-destructive hover:text-destructive"
                disabled={!orderText || isProcessing || isRecording}
                aria-label="清除輸入內容"
              >
                <XCircle className="w-5 h-5 mr-2 group-hover:text-destructive transition-colors" />
                清除內容
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 group transition-all duration-300 ease-in-out transform hover:scale-105"
            disabled={isProcessing || isRecording}
            aria-label="處理訂單"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <Send className="mr-2 h-6 w-6 group-hover:animate-ping-once" style={{ '--ping-duration': '0.8s' } as React.CSSProperties} />
            )}
            {isProcessing ? '處理中...' : '處理訂單'}
          </Button>
        </CardFooter>
      </form>
      <style jsx global>{`
        @keyframes ping-once {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .group-hover\\:animate-ping-once:hover .lucide-send {
          animation: ping-once var(--ping-duration) cubic-bezier(0,0,.2,1);
        }
      `}</style>
    </Card>
  );
};

export default OrderForm;
