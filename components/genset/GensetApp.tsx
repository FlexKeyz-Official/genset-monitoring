"use client";

import { useEffect, useState } from "react";
import { useGenset } from "@/lib/genset/useGenset";
import { ViewName } from "@/lib/genset/types";
import { Header } from "./Header";
import { SystemBanner } from "./SystemBanner";
import { Toast } from "./Toast";
import { DashboardView } from "./DashboardView";
import { MonitoringView } from "./MonitoringView";
import { ConfigurationView } from "./ConfigurationView";

export function GensetApp() {
  const [view, setView] = useState<ViewName>("dashboard");
  const genset = useGenset();

  useEffect(() => {
    if (view === "configuration" && genset.connected) {
      genset.loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, genset.connected]);

  return (
    <div className="min-h-screen">
      <Toast toast={genset.toast} />

      <Header
        connectionLabel={genset.connectionLabel}
        connected={genset.connected}
        view={view}
        onShowView={setView}
        ipInput={genset.ipInput}
        onIpInputChange={genset.setIpInput}
        onEditingChange={genset.setEditingAddress}
        onConnect={genset.connect}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <SystemBanner data={genset.data} />

        {view === "dashboard" && (
          <DashboardView
            data={genset.data}
            onGeneratorCommand={genset.generatorCommand}
            onResetFaults={genset.resetFaults}
            onResetMaintenance={genset.resetMaintenance}
            onToggleOverride={genset.toggleOverride}
            onToggleCurrentProtection={genset.toggleCurrentProtection}
          />
        )}

        {view === "monitoring" && (
          <MonitoringView
            data={genset.data}
            sdFiles={genset.sdFiles}
            onTestSD={genset.testSD}
            onDownloadLog={genset.downloadLog}
            onSyncRTC={genset.syncRTC}
            onTestOil={genset.testOil}
            onRefreshSDFiles={genset.refreshSDFiles}
            onUploadSDFile={genset.uploadSDFile}
            onDownloadSelectedSDFile={genset.downloadSelectedSDFile}
            onCalibrateCTs={genset.calibrateCTs}
          />
        )}

        {view === "configuration" && (
          <ConfigurationView
            config={genset.config}
            onLoadConfig={genset.loadConfig}
            onSaveConfig={genset.saveConfig}
            onRestoreDefault={genset.restoreDefault}
          />
        )}
      </main>
    </div>
  );
}
