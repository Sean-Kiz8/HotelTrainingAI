import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader, SearchInput } from "@/components/layout/page-header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";

function RewardCard({ reward, userPoints, onClaim }: any) {
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const hasEnoughPoints = userPoints >= reward.pointsRequired;
  
  const claimButtonClass = hasEnoughPoints 
    ? "" 
    : "opacity-50 cursor-not-allowed";
  
  function handleClaimAttempt() {
    if (hasEnoughPoints) {
      setShowDialog(true);
    } else {
      toast({
        title: "Недостаточно очков",
        description: `Необходимо ${reward.pointsRequired} очков для получения этой награды`,
        variant: "destructive",
      });
    }
  }
  
  function handleConfirmClaim() {
    setShowDialog(false);
    onClaim(reward.id);
  }
  
  return (
    <>
      <Card className="h-full flex flex-col">
        <CardContent className="p-5 flex-1">
          <div className="flex justify-between items-start mb-3">
            <Badge variant={hasEnoughPoints ? "default" : "outline"}>
              {reward.pointsRequired} очков
            </Badge>
            <span className={`material-icons text-2xl ${hasEnoughPoints ? "text-success" : "text-muted-foreground"}`}>
              {hasEnoughPoints ? "check_circle" : "lock"}
            </span>
          </div>
          
          <div className="aspect-square bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
            <span className="material-icons text-5xl text-neutral-400">
              {reward.type === "certificate" && "workspace_premium"}
              {reward.type === "badge" && "emoji_events"}
              {reward.type === "points" && "stars"}
              {reward.type === "bonus" && "celebration"}
            </span>
          </div>
          
          <h3 className="font-medium text-lg">{reward.name}</h3>
          <p className="text-neutral-600 text-sm mt-1 line-clamp-2">{reward.description}</p>
          
          {!hasEnoughPoints && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{userPoints}</span>
                <span>{reward.pointsRequired}</span>
              </div>
              <Progress value={(userPoints / reward.pointsRequired) * 100} />
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-5 pt-0">
          <Button 
            className={`w-full ${claimButtonClass}`}
            onClick={handleClaimAttempt}
            disabled={!hasEnoughPoints}
          >
            Получить
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение получения награды</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите получить награду "{reward.name}" за {reward.pointsRequired} очков?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Отмена</Button>
            <Button onClick={handleConfirmClaim}>Подтвердить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserRewardCard({ userReward }: any) {
  const { toast } = useToast();
  
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <Badge>Получено</Badge>
          <span className="material-icons text-2xl text-success">check_circle</span>
        </div>
        
        <div className="aspect-square bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
          <span className="material-icons text-5xl text-primary">
            {userReward.reward.type === "certificate" && "workspace_premium"}
            {userReward.reward.type === "badge" && "emoji_events"}
            {userReward.reward.type === "points" && "stars"}
            {userReward.reward.type === "bonus" && "celebration"}
          </span>
        </div>
        
        <h3 className="font-medium text-lg">{userReward.reward.name}</h3>
        <p className="text-neutral-600 text-sm mt-1 line-clamp-2">{userReward.reward.description}</p>
        <p className="text-neutral-500 text-xs mt-3">
          Получено: {new Date(userReward.claimedAt).toLocaleDateString('ru-RU')}
        </p>
      </CardContent>
      
      <CardFooter className="p-5 pt-0">
        {userReward.reward.type === "certificate" ? (
          <Button 
            className="w-full" 
            onClick={() => toast({
              title: "Скачивание сертификата", 
              description: "Сертификат будет скачан в формате PDF"
            })}
          >
            <span className="material-icons text-sm mr-1">download</span>
            Скачать
          </Button>
        ) : (
          <Button 
            variant="outline"
            className="w-full" 
            onClick={() => toast({
              title: "Подробности награды", 
              description: userReward.reward.description
            })}
          >
            Подробнее
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Rewards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  
  // Fetch rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch user rewards
  const { data: userRewards, isLoading: userRewardsLoading } = useQuery({
    queryKey: ['/api/user-rewards', user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Fetch user level (for points)
  const { data: userLevel, isLoading: userLevelLoading } = useQuery({
    queryKey: ['/api/user-level', user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Mutation for claiming a reward
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", "/api/user-rewards", {
        userId: user?.id,
        rewardId: rewardId,
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-level'] });
      
      toast({
        title: "Награда получена!",
        description: "Поздравляем! Вы успешно получили награду",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка получения награды",
        description: error.message || "Произошла ошибка при получении награды",
        variant: "destructive",
      });
    }
  });
  
  const isLoading = rewardsLoading || userRewardsLoading || userLevelLoading;
  const userPoints = userLevel?.points || 0;
  
  // Filter and sort rewards
  const filteredRewards = !isLoading && rewards
    ? rewards
        .filter((reward: any) => 
          reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reward.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (reward.type && reward.type.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter((reward: any) => reward.active)
        .sort((a: any, b: any) => a.pointsRequired - b.pointsRequired)
    : [];
  
  // Filter out already claimed rewards
  const availableRewards = !isLoading && filteredRewards && userRewards
    ? filteredRewards.filter((reward: any) => 
        !userRewards.some((ur: any) => ur.rewardId === reward.id)
      )
    : [];
  
  // Combine user rewards with reward details
  const userRewardsWithDetails = !isLoading && userRewards && rewards
    ? userRewards
        .map((ur: any) => ({
          ...ur,
          reward: rewards.find((r: any) => r.id === ur.rewardId) || {},
        }))
        .filter((ur: any) => 
          ur.reward.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ur.reward.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ur.reward.type && ur.reward.type.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .sort((a: any, b: any) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime())
    : [];
  
  function handleClaimReward(rewardId: number) {
    claimRewardMutation.mutate(rewardId);
  }
  
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Награды">
        <SearchInput
          placeholder="Поиск наград..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </PageHeader>
      
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant={activeTab === "available" ? "default" : "outline"}
          onClick={() => setActiveTab("available")}
        >
          Доступные
        </Button>
        <Button
          variant={activeTab === "claimed" ? "default" : "outline"}
          onClick={() => setActiveTab("claimed")}
        >
          Полученные
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === "available" && (
            <>
              {availableRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableRewards.map((reward: any) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      userPoints={userPoints}
                      onClaim={handleClaimReward}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Награды по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <>
                      <p>Доступных наград пока нет</p>
                      <p className="text-sm mt-2">Зайдите позже или получите больше очков опыта, чтобы разблокировать награды</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          
          {activeTab === "claimed" && (
            <>
              {userRewardsWithDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userRewardsWithDetails.map((userReward: any) => (
                    <UserRewardCard
                      key={userReward.id}
                      userReward={userReward}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {searchQuery ? (
                    <p>Полученные награды по запросу "{searchQuery}" не найдены</p>
                  ) : (
                    <>
                      <p>У вас пока нет полученных наград</p>
                      <p className="text-sm mt-2">Выполняйте задания и получайте очки, чтобы обменять их на награды</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Points card */}
      <div className="mt-6">
        <h3 className="font-sans font-semibold text-lg mb-4">Ваши очки</h3>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="p-4 bg-primary bg-opacity-10 rounded-full mr-4">
                <span className="material-icons text-primary text-2xl">stars</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{userPoints} очков опыта</h4>
                <p className="text-neutral-600 text-sm">
                  Уровень: {userLevel?.level || 1} • До следующего уровня: {
                    userLevel ? (userLevel.nextLevelPoints - userLevel.points) : 100
                  } очков
                </p>
                
                {userLevel && (
                  <div className="mt-2">
                    <Progress 
                      value={(userLevel.points / userLevel.nextLevelPoints) * 100} 
                      className="bg-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}