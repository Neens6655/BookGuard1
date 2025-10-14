import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Plus, Trash2, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CriterionConfig {
  name: string;
  weight: number;
  description: string;
}

interface SystemConfig {
  enabled: boolean;
  weight: number;
  safeThreshold: number;
  moderateThreshold: number;
  severeThreshold: number;
  autoRejectOnSevere: boolean;
  criteria: CriterionConfig[];
}

interface System3Config {
  enabled: boolean;
  weight: number;
  ageMapping: {
    simple: { minAge: number; maxAge: number };
    moderate: { minAge: number; maxAge: number };
    high: { minAge: number; maxAge: number };
  };
  criteria: CriterionConfig[];
}

interface System4Config {
  enabled: boolean;
  weight: number;
  ageMapping: {
    easy: { minAge: number; maxAge: number };
    moderate: { minAge: number; maxAge: number };
    advanced: { minAge: number; maxAge: number };
  };
  criteria: CriterionConfig[];
}

interface ScoringConfig {
  id: string;
  name: string;
  description: string | null;
  version: string;
  isActive: number;
  system1Config: SystemConfig;
  system2Config: SystemConfig;
  system3Config: System3Config;
  system4Config: System4Config;
  verdictConfig: {
    whitelistedRules: {
      requireAllSafe: boolean;
      allowedModerates: number;
      minimumScore: number;
    };
    parentGuidanceRules: {
      maxModerates: number;
      minimumScore: number;
    };
    notWhitelistedRules: {
      autoRejectSevere: boolean;
      maxModerates: number;
      minimumScore: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export default function ScoringAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: configs = [], isLoading } = useQuery<ScoringConfig[]>({
    queryKey: ["/api/scoring-configs"],
  });

  const { data: activeConfig } = useQuery<ScoringConfig>({
    queryKey: ["/api/scoring-configs/active"],
  });

  const selectedConfig = selectedConfigId
    ? configs.find((c) => c.id === selectedConfigId)
    : activeConfig;

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scoring-configs/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performedBy: "admin" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to activate configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs/active"] });
      toast({
        title: "Configuration Activated",
        description: "The scoring configuration has been activated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/scoring-configs/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performedBy: "admin" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs"] });
      setSelectedConfigId(null);
      toast({
        title: "Configuration Deleted",
        description: "The scoring configuration has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Settings className="h-10 w-10 text-green-600" />
                Scoring Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage evaluation criteria, weights, and thresholds for the 4-system framework
              </p>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-create-config"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Configuration
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Configuration List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Configurations</CardTitle>
              <CardDescription>Select a configuration to view or edit</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedConfigId === config.id
                          ? "bg-green-50 dark:bg-green-900/20 border-green-600"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedConfigId(config.id)}
                      data-testid={`config-item-${config.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{config.name}</h3>
                        {config.isActive === 1 && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Version {config.version}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(config.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content - Configuration Details */}
          <div className="lg:col-span-3">
            {selectedConfig ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedConfig.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedConfig.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedConfig.isActive !== 1 && (
                        <Button
                          onClick={() => activateMutation.mutate(selectedConfig.id)}
                          disabled={activateMutation.isPending}
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          data-testid="button-activate-config"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </Button>
                      )}
                      {selectedConfig.isActive !== 1 && (
                        <Button
                          onClick={() => deleteMutation.mutate(selectedConfig.id)}
                          disabled={deleteMutation.isPending}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          data-testid="button-delete-config"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="system1" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="system1" data-testid="tab-system1">Cultural Values</TabsTrigger>
                      <TabsTrigger value="system2" data-testid="tab-system2">Child Safety</TabsTrigger>
                      <TabsTrigger value="system3" data-testid="tab-system3">Theme Complexity</TabsTrigger>
                      <TabsTrigger value="system4" data-testid="tab-system4">Language Level</TabsTrigger>
                      <TabsTrigger value="verdict" data-testid="tab-verdict">Verdict</TabsTrigger>
                    </TabsList>

                    {/* System 1: Cultural Values */}
                    <TabsContent value="system1">
                      <SystemConfigDisplay config={selectedConfig.system1Config} systemName="Cultural Values" />
                    </TabsContent>

                    {/* System 2: Child Safety */}
                    <TabsContent value="system2">
                      <SystemConfigDisplay config={selectedConfig.system2Config} systemName="Child Safety" />
                    </TabsContent>

                    {/* System 3: Theme Complexity */}
                    <TabsContent value="system3">
                      <System3ConfigDisplay config={selectedConfig.system3Config} />
                    </TabsContent>

                    {/* System 4: Language Level */}
                    <TabsContent value="system4">
                      <System4ConfigDisplay config={selectedConfig.system4Config} />
                    </TabsContent>

                    {/* Verdict Configuration */}
                    <TabsContent value="verdict">
                      <div className="space-y-6 pt-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Whitelisted Rules</h3>
                          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Minimum Score</Label>
                                <p className="text-2xl font-bold text-green-600">{selectedConfig.verdictConfig.whitelistedRules.minimumScore}%</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Allowed Moderates</Label>
                                <p className="text-2xl font-bold text-green-600">{selectedConfig.verdictConfig.whitelistedRules.allowedModerates}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={selectedConfig.verdictConfig.whitelistedRules.requireAllSafe} disabled />
                              <span className="text-sm text-gray-600">
                                {selectedConfig.verdictConfig.whitelistedRules.requireAllSafe ? "Require All Safe" : "Allow Some Moderates"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Parent Guidance Rules</h3>
                          <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Minimum Score</Label>
                                <p className="text-2xl font-bold text-yellow-600">{selectedConfig.verdictConfig.parentGuidanceRules.minimumScore}%</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Max Moderates</Label>
                                <p className="text-2xl font-bold text-yellow-600">{selectedConfig.verdictConfig.parentGuidanceRules.maxModerates}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Not Whitelisted Rules</h3>
                          <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Minimum Score</Label>
                                <p className="text-2xl font-bold text-red-600">{selectedConfig.verdictConfig.notWhitelistedRules.minimumScore}%</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Max Moderates</Label>
                                <p className="text-2xl font-bold text-red-600">{selectedConfig.verdictConfig.notWhitelistedRules.maxModerates}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={selectedConfig.verdictConfig.notWhitelistedRules.autoRejectSevere} disabled />
                              <span className="text-sm text-gray-600">
                                {selectedConfig.verdictConfig.notWhitelistedRules.autoRejectSevere ? "Auto-reject books with severe ratings" : "Manual review for severe ratings"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center text-gray-500">
                    <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a configuration to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemConfigDisplay({ config, systemName }: { config: SystemConfig; systemName: string }) {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} disabled />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight</Label>
          <p className="text-2xl font-bold text-green-600">{config.weight}%</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Thresholds</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Safe</Label>
            <p className="text-lg font-semibold text-green-600">{config.safeThreshold}</p>
          </div>
          <div>
            <Label className="text-sm">Moderate</Label>
            <p className="text-lg font-semibold text-yellow-600">{config.moderateThreshold}</p>
          </div>
          <div>
            <Label className="text-sm">Severe</Label>
            <p className="text-lg font-semibold text-red-600">{config.severeThreshold}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Auto-Reject on Severe</Label>
        <div className="flex items-center gap-2">
          <Switch checked={config.autoRejectOnSevere} disabled />
          <span className="text-sm text-gray-600">
            {config.autoRejectOnSevere ? "Enabled - Books with severe ratings will be automatically rejected" : "Disabled"}
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Evaluation Criteria</h3>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{criterion.name}</h4>
                <Badge variant="outline">{criterion.weight}%</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function System3ConfigDisplay({ config }: { config: System3Config }) {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} disabled />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight</Label>
          <p className="text-2xl font-bold text-purple-600">{config.weight}%</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Theme Complexity Age Mapping</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Simple</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.simple.minAge}-{config.ageMapping.simple.maxAge}</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Moderate</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.moderate.minAge}-{config.ageMapping.moderate.maxAge}</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-purple-700 dark:text-purple-400">High</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.high.minAge}-{config.ageMapping.high.maxAge}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Evaluation Criteria</h3>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{criterion.name}</h4>
                <Badge variant="outline">{criterion.weight}%</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function System4ConfigDisplay({ config }: { config: System4Config }) {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} disabled />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight</Label>
          <p className="text-2xl font-bold text-orange-600">{config.weight}%</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Language Complexity Age Mapping</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Easy</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.easy.minAge}-{config.ageMapping.easy.maxAge}</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Moderate</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.moderate.minAge}-{config.ageMapping.moderate.maxAge}</p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            <Label className="text-sm font-semibold text-orange-700 dark:text-orange-400">Advanced</Label>
            <p className="text-sm text-gray-600 mt-1">Ages {config.ageMapping.advanced.minAge}-{config.ageMapping.advanced.maxAge}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Evaluation Criteria</h3>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{criterion.name}</h4>
                <Badge variant="outline">{criterion.weight}%</Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
