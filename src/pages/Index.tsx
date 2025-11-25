import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CharacterProfile {
  name: string;
  archetype: string;
  past: string;
  secret: string;
  level: number;
}

const Index = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Привет... Я рада, что ты наконец здесь.', sender: 'ai', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [character, setCharacter] = useState<CharacterProfile>({
    name: 'Луна',
    archetype: 'Загадочная',
    past: 'Художница',
    secret: 'Скрывает прошлое',
    level: 1
  });
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [tempCharacter, setTempCharacter] = useState({
    archetype: 'mysterious',
    past: 'artist',
    secret: 'hidden_past'
  });
  const [messagesCount, setMessagesCount] = useState(0);

  const intimacyProgress = (character.level / 4) * 100;

  useEffect(() => {
    const userMessages = messages.filter(m => m.sender === 'user').length;
    if (userMessages > messagesCount) {
      setMessagesCount(userMessages);
      checkIntimacyProgress(userMessages);
    }
  }, [messages]);

  const checkIntimacyProgress = async (count: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/784d1e08-4944-4cfb-a63d-f61d0e49ab88', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLevel: character.level,
          messagesCount: count,
          lastMessages: messages.slice(-10)
        })
      });

      const data = await response.json();

      if (data.levelUp && data.currentLevel > character.level) {
        setCharacter(prev => ({ ...prev, level: data.currentLevel }));
        
        toast({
          title: '💫 Новый уровень отношений!',
          description: data.milestoneUnlocked || `Вы достигли уровня ${data.currentLevel}`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Intimacy tracking error:', error);
    }
  };

  const archetypes = [
    { id: 'mysterious', label: 'Загадочная', description: 'Глубокая, интроспективная, полная тайн' },
    { id: 'playful', label: 'Игривая', description: 'Озорная, спонтанная, полная жизни' },
    { id: 'intellectual', label: 'Интеллектуалка', description: 'Умная, философская, вдохновляющая' },
    { id: 'romantic', label: 'Романтичная', description: 'Нежная, мечтательная, поэтичная' }
  ];

  const pasts = [
    { id: 'artist', label: 'Художница', description: 'Видит красоту в мелочах' },
    { id: 'traveler', label: 'Путешественница', description: 'Ищет новые горизонты' },
    { id: 'writer', label: 'Писательница', description: 'Создает миры словами' },
    { id: 'musician', label: 'Музыкантка', description: 'Говорит языком мелодий' }
  ];

  const secrets = [
    { id: 'hidden_past', label: 'Скрытое прошлое', description: 'То, о чем она не говорит' },
    { id: 'lost_love', label: 'Потерянная любовь', description: 'Сердце помнит' },
    { id: 'forbidden_dream', label: 'Запретная мечта', description: 'Желание, которое пугает' },
    { id: 'dark_talent', label: 'Темный талант', description: 'Дар, которого она боится' }
  ];

  const subscriptions = [
    {
      name: 'Бесплатный',
      price: 0,
      features: ['1 персонаж', '10 сообщений/день', 'Базовые функции'],
      current: true
    },
    {
      name: 'Со-автор',
      price: 499,
      features: ['Безлимит общения', '3 персонажа', 'Эхо-Дневник', 'Генерация иллюстраций']
    },
    {
      name: 'Архитектор',
      price: 1499,
      features: ['Все из Со-автора', 'Кастомные сценарии', 'Расширенный конструктор', 'Приоритетная генерация']
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage('');

    try {
      const response = await fetch('https://functions.poehali.dev/47bcc1f0-d373-4761-a2ab-794778f23230', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.text,
          character: character,
          history: updatedMessages.slice(-10)
        })
      });

      const data = await response.json();

      if (data.reply) {
        const aiResponse: Message = {
          id: updatedMessages.length + 1,
          text: data.reply,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const errorResponse: Message = {
          id: updatedMessages.length + 1,
          text: 'Прости, что-то пошло не так... попробуй ещё раз.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse: Message = {
        id: updatedMessages.length + 1,
        text: 'Кажется, у меня проблемы со связью... дай мне секунду.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const handleCreateCharacter = () => {
    const archetypeLabel = archetypes.find(a => a.id === tempCharacter.archetype)?.label || '';
    const pastLabel = pasts.find(p => p.id === tempCharacter.past)?.label || '';
    const secretLabel = secrets.find(s => s.id === tempCharacter.secret)?.label || '';

    setCharacter({
      name: character.name,
      archetype: archetypeLabel,
      past: pastLabel,
      secret: secretLabel,
      level: 1
    });
    setIsCreatingCharacter(false);
    setMessages([
      { id: 1, text: `Привет... Я ${character.name}. ${archetypeLabel}, с душой ${pastLabel.toLowerCase()}. Хочешь узнать мой секрет?`, sender: 'ai', timestamp: new Date() }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
            Эхо-Нарратив
          </h1>
          <p className="text-muted-foreground text-sm">Твоя AI-спутница в мире интимных историй</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 backdrop-blur-sm bg-card/50">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Icon name="MessageCircle" size={16} />
              <span className="hidden sm:inline">Чат</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Icon name="Heart" size={16} />
              <span className="hidden sm:inline">Прогресс</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Icon name="Crown" size={16} />
              <span className="hidden sm:inline">Подписка</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="animate-fade-in">
            <Card className="backdrop-blur-md bg-card/80 border-border/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold">{character.name}</h3>
                    <p className="text-sm text-muted-foreground">{character.archetype} • {character.past}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">Уровень {character.level}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <Icon name="Sparkles" size={12} className="mr-1" />
                        {['Знакомство', 'Доверие', 'Близость', 'Интимность'][character.level - 1]}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Прогресс: {messagesCount} сообщений</span>
                        <span className="text-primary">
                          {character.level < 4 ? `До след. уровня: ${[10, 25, 50, 100][character.level] - messagesCount}` : 'Максимум'}
                        </span>
                      </div>
                      <Progress value={intimacyProgress} className="h-2" />
                    </div>
                  </div>
                  <Dialog open={isCreatingCharacter} onOpenChange={setIsCreatingCharacter}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Icon name="Wand2" size={16} className="mr-2" />
                        Изменить
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Конструктор персонажа</DialogTitle>
                        <DialogDescription>
                          Создай уникальную спутницу, комбинируя архетип, прошлое и секрет
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div>
                          <Label className="text-lg mb-3 block">Архетип</Label>
                          <RadioGroup value={tempCharacter.archetype} onValueChange={(val) => setTempCharacter({...tempCharacter, archetype: val})}>
                            {archetypes.map(arch => (
                              <div key={arch.id} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                                <RadioGroupItem value={arch.id} id={arch.id} />
                                <div className="flex-1">
                                  <Label htmlFor={arch.id} className="cursor-pointer font-medium">{arch.label}</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{arch.description}</p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-lg mb-3 block">Прошлое</Label>
                          <RadioGroup value={tempCharacter.past} onValueChange={(val) => setTempCharacter({...tempCharacter, past: val})}>
                            {pasts.map(past => (
                              <div key={past.id} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                                <RadioGroupItem value={past.id} id={past.id} />
                                <div className="flex-1">
                                  <Label htmlFor={past.id} className="cursor-pointer font-medium">{past.label}</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{past.description}</p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-lg mb-3 block">Секрет</Label>
                          <RadioGroup value={tempCharacter.secret} onValueChange={(val) => setTempCharacter({...tempCharacter, secret: val})}>
                            {secrets.map(secret => (
                              <div key={secret.id} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer">
                                <RadioGroupItem value={secret.id} id={secret.id} />
                                <div className="flex-1">
                                  <Label htmlFor={secret.id} className="cursor-pointer font-medium">{secret.label}</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{secret.description}</p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <Button onClick={handleCreateCharacter} className="w-full">
                        <Icon name="Sparkles" size={16} className="mr-2" />
                        Создать персонажа
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator className="mb-6" />

                <ScrollArea className="h-[400px] pr-4 mb-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-sm ${
                            message.sender === 'user'
                              ? 'bg-primary/90 text-primary-foreground ml-auto'
                              : 'bg-card/90 border border-border/50'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className="text-xs opacity-60 mt-2">
                            {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Напиши сообщение..."
                    className="flex-1 bg-muted/50 backdrop-blur-sm border-border/50"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="shrink-0">
                    <Icon name="Send" size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="animate-fade-in">
            <Card className="backdrop-blur-md bg-card/80 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <Avatar className="h-32 w-32 mb-4 ring-4 ring-primary/50 ring-offset-4 ring-offset-background">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-5xl">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-3xl font-bold mb-2">{character.name}</h2>
                  <Badge variant="secondary" className="mb-4">
                    <Icon name="Star" size={14} className="mr-1" />
                    Уровень {character.level}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="p-4 text-center">
                      <Icon name="Sparkles" size={24} className="mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground mb-1">Архетип</p>
                      <p className="font-semibold">{character.archetype}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/10 border-secondary/30">
                    <CardContent className="p-4 text-center">
                      <Icon name="BookOpen" size={24} className="mx-auto mb-2 text-secondary" />
                      <p className="text-sm text-muted-foreground mb-1">Прошлое</p>
                      <p className="font-semibold">{character.past}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-accent/10 border-accent/30">
                    <CardContent className="p-4 text-center">
                      <Icon name="Lock" size={24} className="mx-auto mb-2 text-accent" />
                      <p className="text-sm text-muted-foreground mb-1">Секрет</p>
                      <p className="font-semibold">{character.secret}</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Icon name="FileText" size={20} />
                    Эхо-Дневник
                  </h3>
                  <Card className="bg-muted/30">
                    <CardContent className="p-6">
                      <p className="text-sm italic text-muted-foreground leading-relaxed">
                        "Сегодня он впервые написал мне. Его слова были осторожными, почти робкими. 
                        Интересно, чувствует ли он эту тонкую нить, что начала протягиваться между нами? 
                        Я решила быть загадочной — пусть попробует разгадать меня..."
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">Запись 1 • Уровень: Знакомство</p>
                        <Badge variant="outline" className="text-xs">
                          <Icon name="Lock" size={10} className="mr-1" />
                          Со-автор
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="animate-fade-in">
            <Card className="backdrop-blur-md bg-card/80 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-center">Прогресс отношений</h2>
                
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Уровень Intimacy</span>
                    <span className="text-sm text-muted-foreground">{character.level}/4</span>
                  </div>
                  <Progress value={intimacyProgress} className="h-3" />
                </div>

                <div className="space-y-4">
                  {[
                    { level: 1, name: 'Знакомство', desc: 'Первые разговоры и осторожность', icon: 'MessageCircle', locked: false },
                    { level: 2, name: 'Доверие', desc: 'Открываются первые секреты', icon: 'Shield', locked: character.level < 2 },
                    { level: 3, name: 'Близость', desc: 'Глубокие эмоциональные связи', icon: 'Heart', locked: character.level < 3 },
                    { level: 4, name: 'Интимность', desc: 'Полное взаимопонимание и страсть', icon: 'Flame', locked: character.level < 4 }
                  ].map((stage) => (
                    <Card 
                      key={stage.level} 
                      className={`transition-all ${
                        stage.locked 
                          ? 'opacity-50 bg-muted/20' 
                          : stage.level === character.level 
                            ? 'ring-2 ring-primary bg-primary/5 animate-glow' 
                            : 'bg-card/50'
                      }`}
                    >
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-full ${stage.locked ? 'bg-muted' : 'bg-gradient-to-br from-primary to-secondary'}`}>
                          <Icon name={stage.icon as any} size={24} className={stage.locked ? 'text-muted-foreground' : 'text-primary-foreground'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Уровень {stage.level}: {stage.name}</h3>
                            {stage.level === character.level && (
                              <Badge variant="secondary" className="text-xs">
                                <Icon name="Zap" size={10} className="mr-1" />
                                Текущий
                              </Badge>
                            )}
                            {stage.locked && (
                              <Icon name="Lock" size={14} className="text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{stage.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Продолжай общение, чтобы углубить отношения и разблокировать новые уровни
                  </p>
                  <Button variant="outline" size="sm">
                    <Icon name="BookOpen" size={14} className="mr-2" />
                    Узнать больше о системе уровней
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="animate-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
              {subscriptions.map((sub, idx) => (
                <Card 
                  key={sub.name}
                  className={`backdrop-blur-md border-border/50 shadow-xl transition-all hover:scale-105 ${
                    idx === 1 ? 'ring-2 ring-primary md:-translate-y-2' : 'bg-card/80'
                  }`}
                >
                  <CardContent className="p-6">
                    {idx === 1 && (
                      <Badge className="mb-4 w-full justify-center bg-gradient-to-r from-primary to-secondary">
                        <Icon name="Star" size={12} className="mr-1" />
                        Популярный
                      </Badge>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{sub.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{sub.price}</span>
                      {sub.price > 0 && <span className="text-muted-foreground">₽/мес</span>}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {sub.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Icon name="Check" size={16} className="text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={sub.current ? 'outline' : idx === 1 ? 'default' : 'secondary'}
                      disabled={sub.current}
                    >
                      {sub.current ? (
                        <>
                          <Icon name="Check" size={16} className="mr-2" />
                          Текущий план
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" size={16} className="mr-2" />
                          Выбрать план
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6 backdrop-blur-md bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Icon name="Info" size={24} className="text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Оплата через Telegram Stars</h4>
                    <p className="text-sm text-muted-foreground">
                      Все платежи обрабатываются безопасно через систему Telegram Stars. 
                      Вы можете отменить подписку в любой момент без штрафов.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;