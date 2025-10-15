import { useState, useEffect } from "react";
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
import { Settings, Save, Plus, Trash2, CheckCircle, Clock, ArrowLeft, Edit, X, Copy, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface NMCConfig {
  enabled: boolean;
  categories: {
    gambling: {
      thresholds: Array<{ maxAge: number; ageBand: string; description: string; }>;
    };
    language: {
      thresholds: Array<{ maxAge: number; ageBand: string; description: string; }>;
    };
    violence: {
      thresholds: Array<{ maxAge: number; ageBand: string; description: string; }>;
    };
    substanceUse: {
      thresholds: Array<{ maxAge: number; ageBand: string; description: string; }>;
    };
    sexualContent: {
      thresholds: Array<{ maxAge: number; ageBand: string; description: string; }>;
    };
  };
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
  nmcConfig?: NMCConfig;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedConfig, setEditedConfig] = useState<ScoringConfig | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data: configs = [], isLoading } = useQuery<ScoringConfig[]>({
    queryKey: ["/api/scoring-configs"],
  });

  const { data: activeConfig } = useQuery<ScoringConfig>({
    queryKey: ["/api/scoring-configs/active"],
  });

  const selectedConfig = selectedConfigId
    ? configs.find((c) => c.id === selectedConfigId)
    : activeConfig;

  // Initialize edited config when selection changes
  useEffect(() => {
    if (selectedConfig && isEditMode) {
      setEditedConfig(JSON.parse(JSON.stringify(selectedConfig)));
      setIsDirty(false);
    }
  }, [selectedConfig, isEditMode]);

  const cloneMutation = useMutation({
    mutationFn: async (sourceConfig: ScoringConfig) => {
      const clonedConfig = {
        ...JSON.parse(JSON.stringify(sourceConfig)),
        id: undefined,
        name: `${sourceConfig.name} (Copy)`,
        version: `${sourceConfig.version}.1`,
        isActive: 0,
        createdAt: undefined,
        updatedAt: undefined,
      };
      
      return await apiRequest('POST', '/api/scoring-configs', clonedConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs"] });
      toast({
        title: "Configuration Cloned",
        description: "Successfully created a copy of the configuration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Clone Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (config: ScoringConfig) => {
      return await apiRequest('POST', '/api/scoring-configs', {
        ...config,
        id: undefined,
        isActive: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs"] });
      setIsEditMode(false);
      setIsDirty(false);
      toast({
        title: "Configuration Saved",
        description: "New configuration version created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleEditToggle = () => {
    if (isEditMode && isDirty) {
      setShowDiscardDialog(true);
    } else {
      setIsEditMode(!isEditMode);
      if (!isEditMode && selectedConfig) {
        setEditedConfig(JSON.parse(JSON.stringify(selectedConfig)));
      }
    }
  };

  const handleDiscard = () => {
    setIsEditMode(false);
    setIsDirty(false);
    setEditedConfig(null);
    setShowDiscardDialog(false);
  };

  const handleSaveAsNew = () => {
    if (editedConfig) {
      saveMutation.mutate(editedConfig);
    }
  };

  const saveAndActivateMutation = useMutation({
    mutationFn: async (config: ScoringConfig) => {
      // First create the new configuration
      const newConfig = await apiRequest('POST', '/api/scoring-configs', {
        ...config,
        id: undefined,
        isActive: 0,
      }) as unknown as ScoringConfig;
      
      // Then activate it
      const activateResponse = await fetch(`/api/scoring-configs/${newConfig.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performedBy: "admin" }),
      });
      
      if (!activateResponse.ok) {
        const error = await activateResponse.json();
        throw new Error(error.error || "Failed to activate configuration");
      }
      
      const result = await activateResponse.json();
      return { config: newConfig, result };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-configs/active"] });
      setIsEditMode(false);
      setIsDirty(false);
      toast({
        title: "Configuration Saved & Activated",
        description: "New configuration created and activated successfully.",
      });
    },
    onError: (error: Error) => {
      // Stay in edit mode on error so user can fix issues
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveAndActivate = () => {
    if (editedConfig) {
      saveAndActivateMutation.mutate(editedConfig);
    }
  };

  const updateEditedConfig = (updates: Partial<ScoringConfig>) => {
    setEditedConfig(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  };

  const validateWeights = () => {
    if (!editedConfig) return { isValid: true, total: 100, errors: [] };
    
    const errors: string[] = [];
    
    // Validate system weights total
    const total = editedConfig.system1Config.weight + 
                  editedConfig.system2Config.weight + 
                  editedConfig.system3Config.weight + 
                  editedConfig.system4Config.weight;
    
    if (total !== 100) {
      errors.push(`System weights must total 100% (currently ${total}%)`);
    }
    
    // Validate threshold ordering for System 1
    if (editedConfig.system1Config.safeThreshold < editedConfig.system1Config.moderateThreshold) {
      errors.push('System 1: Safe threshold must be ≥ Moderate threshold');
    }
    if (editedConfig.system1Config.moderateThreshold < editedConfig.system1Config.severeThreshold) {
      errors.push('System 1: Moderate threshold must be ≥ Severe threshold');
    }
    
    // Validate threshold ordering for System 2
    if (editedConfig.system2Config.safeThreshold < editedConfig.system2Config.moderateThreshold) {
      errors.push('System 2: Safe threshold must be ≥ Moderate threshold');
    }
    if (editedConfig.system2Config.moderateThreshold < editedConfig.system2Config.severeThreshold) {
      errors.push('System 2: Moderate threshold must be ≥ Severe threshold');
    }
    
    // Validate criteria weights for each system
    const system1CriteriaTotal = editedConfig.system1Config.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (system1CriteriaTotal !== 100) {
      errors.push(`System 1 criteria weights must total 100% (currently ${system1CriteriaTotal}%)`);
    }
    
    const system2CriteriaTotal = editedConfig.system2Config.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (system2CriteriaTotal !== 100) {
      errors.push(`System 2 criteria weights must total 100% (currently ${system2CriteriaTotal}%)`);
    }
    
    const system3CriteriaTotal = editedConfig.system3Config.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (system3CriteriaTotal !== 100) {
      errors.push(`System 3 criteria weights must total 100% (currently ${system3CriteriaTotal}%)`);
    }
    
    const system4CriteriaTotal = editedConfig.system4Config.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (system4CriteriaTotal !== 100) {
      errors.push(`System 4 criteria weights must total 100% (currently ${system4CriteriaTotal}%)`);
    }
    
    return { isValid: errors.length === 0, total, errors };
  };

  const displayConfig = isEditMode ? editedConfig : selectedConfig;
  const weightValidation = validateWeights();

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
                      onClick={() => {
                        if (isEditMode && isDirty) {
                          setShowDiscardDialog(true);
                        } else {
                          setSelectedConfigId(config.id);
                          setIsEditMode(false);
                        }
                      }}
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
            {displayConfig ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditMode && editedConfig ? (
                        <div className="space-y-2">
                          <Input
                            value={editedConfig.name}
                            onChange={(e) => updateEditedConfig({ name: e.target.value })}
                            className="text-2xl font-bold h-auto py-2"
                            data-testid="input-config-name"
                          />
                          <Textarea
                            value={editedConfig.description || ""}
                            onChange={(e) => updateEditedConfig({ description: e.target.value })}
                            placeholder="Configuration description..."
                            className="text-sm"
                            data-testid="input-config-description"
                          />
                          <Input
                            value={editedConfig.version}
                            onChange={(e) => updateEditedConfig({ version: e.target.value })}
                            placeholder="Version (e.g., 2.0.0)"
                            className="text-sm max-w-xs"
                            data-testid="input-config-version"
                          />
                        </div>
                      ) : (
                        <>
                          <CardTitle className="flex items-center gap-2">
                            {displayConfig.name}
                            {isDirty && <Badge variant="outline" className="text-orange-600">Unsaved Changes</Badge>}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {displayConfig.description || "No description provided"}
                          </CardDescription>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isEditMode ? (
                        <>
                          <Button
                            onClick={() => selectedConfig && cloneMutation.mutate(selectedConfig)}
                            disabled={cloneMutation.isPending}
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            data-testid="button-clone-config"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </Button>
                          <Button
                            onClick={handleEditToggle}
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            data-testid="button-edit-config"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {displayConfig.isActive !== 1 && (
                            <>
                              <Button
                                onClick={() => activateMutation.mutate(displayConfig.id)}
                                disabled={activateMutation.isPending}
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                data-testid="button-activate-config"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </Button>
                              <Button
                                onClick={() => deleteMutation.mutate(displayConfig.id)}
                                disabled={deleteMutation.isPending}
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                data-testid="button-delete-config"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleSaveAndActivate}
                            disabled={!weightValidation.isValid || saveAndActivateMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid="button-save-activate-config"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {saveAndActivateMutation.isPending ? "Saving..." : "Save & Activate"}
                          </Button>
                          <Button
                            onClick={handleSaveAsNew}
                            disabled={!weightValidation.isValid || saveMutation.isPending}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            data-testid="button-save-config"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save as New
                          </Button>
                          <Button
                            onClick={handleEditToggle}
                            variant="outline"
                            data-testid="button-cancel-edit"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditMode && !weightValidation.isValid && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-sm text-red-600">Configuration Validation Errors</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1">
                        {weightValidation.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-red-500 mt-2">Fix these issues before saving the configuration.</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="system1" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="system1" data-testid="tab-system1">Cultural Values</TabsTrigger>
                      <TabsTrigger value="system2" data-testid="tab-system2">Child Safety</TabsTrigger>
                      <TabsTrigger value="system3" data-testid="tab-system3">Theme Complexity</TabsTrigger>
                      <TabsTrigger value="system4" data-testid="tab-system4">Language Level</TabsTrigger>
                      <TabsTrigger value="nmc" data-testid="tab-nmc">NMC Standards</TabsTrigger>
                      <TabsTrigger value="verdict" data-testid="tab-verdict">Verdict</TabsTrigger>
                    </TabsList>

                    <TabsContent value="system1">
                      <SystemConfigEditor 
                        config={displayConfig.system1Config}
                        systemName="Cultural Values"
                        isEditMode={isEditMode}
                        onUpdate={(updates) => updateEditedConfig({ 
                          system1Config: { ...displayConfig.system1Config, ...updates } 
                        })}
                      />
                    </TabsContent>

                    <TabsContent value="system2">
                      <SystemConfigEditor 
                        config={displayConfig.system2Config}
                        systemName="Child Safety"
                        isEditMode={isEditMode}
                        onUpdate={(updates) => updateEditedConfig({ 
                          system2Config: { ...displayConfig.system2Config, ...updates } 
                        })}
                      />
                    </TabsContent>

                    <TabsContent value="system3">
                      <System3ConfigEditor 
                        config={displayConfig.system3Config}
                        isEditMode={isEditMode}
                        onUpdate={(updates) => updateEditedConfig({ 
                          system3Config: { ...displayConfig.system3Config, ...updates } 
                        })}
                      />
                    </TabsContent>

                    <TabsContent value="system4">
                      <System4ConfigEditor 
                        config={displayConfig.system4Config}
                        isEditMode={isEditMode}
                        onUpdate={(updates) => updateEditedConfig({ 
                          system4Config: { ...displayConfig.system4Config, ...updates } 
                        })}
                      />
                    </TabsContent>

                    <TabsContent value="nmc">
                      {displayConfig.nmcConfig ? (
                        <div className="space-y-6 pt-4">
                          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200">
                            <h3 className="text-md font-semibold mb-2 text-purple-900 dark:text-purple-100">About NMC Standards</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              NMC Standards system is read-only and managed separately. It evaluates content across 5 regulatory categories.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 pt-4">
                          <div className="text-center py-12 text-gray-500">
                            <p>NMC Standards configuration not available for this version</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="verdict">
                      <VerdictConfigEditor
                        config={displayConfig.verdictConfig}
                        isEditMode={isEditMode}
                        onUpdate={(updates) => updateEditedConfig({ 
                          verdictConfig: { ...displayConfig.verdictConfig, ...updates } 
                        })}
                      />
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

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SystemConfigEditor({ 
  config, 
  systemName, 
  isEditMode, 
  onUpdate 
}: { 
  config: SystemConfig; 
  systemName: string; 
  isEditMode: boolean;
  onUpdate: (updates: Partial<SystemConfig>) => void;
}) {
  const criteriaTotal = config.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.enabled} 
              onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              disabled={!isEditMode}
            />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight (%)</Label>
          {isEditMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Slider
                  value={[config.weight]}
                  onValueChange={(value) => onUpdate({ weight: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdate({ weight: Math.max(0, Math.min(100, val)) });
                  }}
                  min={0}
                  max={100}
                  className="w-20"
                  data-testid={`input-weight-${systemName.toLowerCase().replace(/\s+/g, '-')}`}
                />
              </div>
              <p className="text-2xl font-bold text-green-600">{config.weight}%</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-green-600">{config.weight}%</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Thresholds</h3>
        {isEditMode ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Safe (≥)</Label>
              <Input
                type="number"
                value={config.safeThreshold}
                onChange={(e) => onUpdate({ safeThreshold: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm">Moderate (≥)</Label>
              <Input
                type="number"
                value={config.moderateThreshold}
                onChange={(e) => onUpdate({ moderateThreshold: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm">Severe (&lt;)</Label>
              <Input
                type="number"
                value={config.severeThreshold}
                onChange={(e) => onUpdate({ severeThreshold: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="mt-2"
              />
            </div>
          </div>
        ) : (
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
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Auto-Reject on Severe</Label>
        <div className="flex items-center gap-2">
          <Switch 
            checked={config.autoRejectOnSevere}
            onCheckedChange={(checked) => onUpdate({ autoRejectOnSevere: checked })}
            disabled={!isEditMode}
          />
          <span className="text-sm text-gray-600">
            {config.autoRejectOnSevere ? "Enabled - Books with severe ratings will be automatically rejected" : "Disabled"}
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold">Evaluation Criteria</h3>
          {isEditMode && (
            <div className="flex items-center gap-2">
              <Badge variant={criteriaTotal === 100 ? "default" : "destructive"}>
                Total: {criteriaTotal}%
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newCriteria = [...config.criteria, { name: "New Criterion", weight: 0, description: "" }];
                  onUpdate({ criteria: newCriteria });
                }}
                data-testid="button-add-criterion"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isEditMode ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={criterion.name}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, name: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Criterion name"
                      />
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, description: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Description"
                        className="text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Weight:</Label>
                        <Input
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => {
                            const newCriteria = [...config.criteria];
                            newCriteria[index] = { ...criterion, weight: parseInt(e.target.value) || 0 };
                            onUpdate({ criteria: newCriteria });
                          }}
                          className="w-20"
                          min={0}
                          max={100}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => {
                        const newCriteria = config.criteria.filter((_, i) => i !== index);
                        onUpdate({ criteria: newCriteria });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{criterion.name}</h4>
                    <Badge variant="outline">{criterion.weight}%</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function System3ConfigEditor({ 
  config, 
  isEditMode, 
  onUpdate 
}: { 
  config: System3Config; 
  isEditMode: boolean;
  onUpdate: (updates: Partial<System3Config>) => void;
}) {
  const criteriaTotal = config.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.enabled}
              onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              disabled={!isEditMode}
            />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight (%)</Label>
          {isEditMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Slider
                  value={[config.weight]}
                  onValueChange={(value) => onUpdate({ weight: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdate({ weight: Math.max(0, Math.min(100, val)) });
                  }}
                  min={0}
                  max={100}
                  className="w-20"
                  data-testid="input-weight-theme-complexity"
                />
              </div>
              <p className="text-2xl font-bold text-purple-600">{config.weight}%</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-purple-600">{config.weight}%</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Theme Complexity Age Mapping</h3>
        {isEditMode ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Simple</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.simple.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      simple: { ...config.ageMapping.simple, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.simple.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      simple: { ...config.ageMapping.simple, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Moderate</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.moderate.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      moderate: { ...config.ageMapping.moderate, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.moderate.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      moderate: { ...config.ageMapping.moderate, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-purple-700 dark:text-purple-400">High</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.high.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      high: { ...config.ageMapping.high, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.high.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      high: { ...config.ageMapping.high, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold">Evaluation Criteria</h3>
          {isEditMode && (
            <div className="flex items-center gap-2">
              <Badge variant={criteriaTotal === 100 ? "default" : "destructive"}>
                Total: {criteriaTotal}%
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newCriteria = [...config.criteria, { name: "New Criterion", weight: 0, description: "" }];
                  onUpdate({ criteria: newCriteria });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isEditMode ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={criterion.name}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, name: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Criterion name"
                      />
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, description: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Description"
                        className="text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Weight:</Label>
                        <Input
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => {
                            const newCriteria = [...config.criteria];
                            newCriteria[index] = { ...criterion, weight: parseInt(e.target.value) || 0 };
                            onUpdate({ criteria: newCriteria });
                          }}
                          className="w-20"
                          min={0}
                          max={100}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => {
                        const newCriteria = config.criteria.filter((_, i) => i !== index);
                        onUpdate({ criteria: newCriteria });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{criterion.name}</h4>
                    <Badge variant="outline">{criterion.weight}%</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function System4ConfigEditor({ 
  config, 
  isEditMode, 
  onUpdate 
}: { 
  config: System4Config; 
  isEditMode: boolean;
  onUpdate: (updates: Partial<System4Config>) => void;
}) {
  const criteriaTotal = config.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Enabled</Label>
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.enabled}
              onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              disabled={!isEditMode}
            />
            <span className="text-sm text-gray-600">{config.enabled ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Weight (%)</Label>
          {isEditMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Slider
                  value={[config.weight]}
                  onValueChange={(value) => onUpdate({ weight: value[0] })}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.weight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    onUpdate({ weight: Math.max(0, Math.min(100, val)) });
                  }}
                  min={0}
                  max={100}
                  className="w-20"
                  data-testid="input-weight-language-level"
                />
              </div>
              <p className="text-2xl font-bold text-orange-600">{config.weight}%</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-orange-600">{config.weight}%</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-md font-semibold">Language Complexity Age Mapping</h3>
        {isEditMode ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-green-700 dark:text-green-400">Easy</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.easy.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      easy: { ...config.ageMapping.easy, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.easy.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      easy: { ...config.ageMapping.easy, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Moderate</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.moderate.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      moderate: { ...config.ageMapping.moderate, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.moderate.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      moderate: { ...config.ageMapping.moderate, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg space-y-2">
              <Label className="text-sm font-semibold text-orange-700 dark:text-orange-400">Advanced</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.ageMapping.advanced.minAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      advanced: { ...config.ageMapping.advanced, minAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Min"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={config.ageMapping.advanced.maxAge}
                  onChange={(e) => onUpdate({
                    ageMapping: {
                      ...config.ageMapping,
                      advanced: { ...config.ageMapping.advanced, maxAge: parseInt(e.target.value) || 0 }
                    }
                  })}
                  placeholder="Max"
                  className="w-20"
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold">Evaluation Criteria</h3>
          {isEditMode && (
            <div className="flex items-center gap-2">
              <Badge variant={criteriaTotal === 100 ? "default" : "destructive"}>
                Total: {criteriaTotal}%
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newCriteria = [...config.criteria, { name: "New Criterion", weight: 0, description: "" }];
                  onUpdate({ criteria: newCriteria });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {config.criteria.map((criterion, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isEditMode ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={criterion.name}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, name: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Criterion name"
                      />
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => {
                          const newCriteria = [...config.criteria];
                          newCriteria[index] = { ...criterion, description: e.target.value };
                          onUpdate({ criteria: newCriteria });
                        }}
                        placeholder="Description"
                        className="text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Weight:</Label>
                        <Input
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => {
                            const newCriteria = [...config.criteria];
                            newCriteria[index] = { ...criterion, weight: parseInt(e.target.value) || 0 };
                            onUpdate({ criteria: newCriteria });
                          }}
                          className="w-20"
                          min={0}
                          max={100}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => {
                        const newCriteria = config.criteria.filter((_, i) => i !== index);
                        onUpdate({ criteria: newCriteria });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{criterion.name}</h4>
                    <Badge variant="outline">{criterion.weight}%</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{criterion.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerdictConfigEditor({
  config,
  isEditMode,
  onUpdate
}: {
  config: ScoringConfig['verdictConfig'];
  isEditMode: boolean;
  onUpdate: (updates: Partial<ScoringConfig['verdictConfig']>) => void;
}) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Whitelisted Rules</h3>
        <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
          {isEditMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score (%)</Label>
                <Input
                  type="number"
                  value={config.whitelistedRules.minimumScore}
                  onChange={(e) => onUpdate({
                    whitelistedRules: {
                      ...config.whitelistedRules,
                      minimumScore: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={100}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Allowed Moderates</Label>
                <Input
                  type="number"
                  value={config.whitelistedRules.allowedModerates}
                  onChange={(e) => onUpdate({
                    whitelistedRules: {
                      ...config.whitelistedRules,
                      allowedModerates: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={4}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score</Label>
                <p className="text-2xl font-bold text-green-600">{config.whitelistedRules.minimumScore}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Allowed Moderates</Label>
                <p className="text-2xl font-bold text-green-600">{config.whitelistedRules.allowedModerates}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.whitelistedRules.requireAllSafe}
              onCheckedChange={(checked) => onUpdate({
                whitelistedRules: {
                  ...config.whitelistedRules,
                  requireAllSafe: checked
                }
              })}
              disabled={!isEditMode}
            />
            <span className="text-sm text-gray-600">
              {config.whitelistedRules.requireAllSafe ? "Require All Safe" : "Allow Some Moderates"}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Parent Guidance Rules</h3>
        <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
          {isEditMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score (%)</Label>
                <Input
                  type="number"
                  value={config.parentGuidanceRules.minimumScore}
                  onChange={(e) => onUpdate({
                    parentGuidanceRules: {
                      ...config.parentGuidanceRules,
                      minimumScore: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={100}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Moderates</Label>
                <Input
                  type="number"
                  value={config.parentGuidanceRules.maxModerates}
                  onChange={(e) => onUpdate({
                    parentGuidanceRules: {
                      ...config.parentGuidanceRules,
                      maxModerates: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={4}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score</Label>
                <p className="text-2xl font-bold text-yellow-600">{config.parentGuidanceRules.minimumScore}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Moderates</Label>
                <p className="text-2xl font-bold text-yellow-600">{config.parentGuidanceRules.maxModerates}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Not Whitelisted Rules</h3>
        <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
          {isEditMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score (%)</Label>
                <Input
                  type="number"
                  value={config.notWhitelistedRules.minimumScore}
                  onChange={(e) => onUpdate({
                    notWhitelistedRules: {
                      ...config.notWhitelistedRules,
                      minimumScore: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={100}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Moderates</Label>
                <Input
                  type="number"
                  value={config.notWhitelistedRules.maxModerates}
                  onChange={(e) => onUpdate({
                    notWhitelistedRules: {
                      ...config.notWhitelistedRules,
                      maxModerates: parseInt(e.target.value) || 0
                    }
                  })}
                  min={0}
                  max={4}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Minimum Score</Label>
                <p className="text-2xl font-bold text-red-600">{config.notWhitelistedRules.minimumScore}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Moderates</Label>
                <p className="text-2xl font-bold text-red-600">{config.notWhitelistedRules.maxModerates}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch 
              checked={config.notWhitelistedRules.autoRejectSevere}
              onCheckedChange={(checked) => onUpdate({
                notWhitelistedRules: {
                  ...config.notWhitelistedRules,
                  autoRejectSevere: checked
                }
              })}
              disabled={!isEditMode}
            />
            <span className="text-sm text-gray-600">
              {config.notWhitelistedRules.autoRejectSevere ? "Auto-reject books with severe ratings" : "Manual review for severe ratings"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
