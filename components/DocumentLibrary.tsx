
import React, { useState, useMemo } from 'react';
import { Project, Indicator, Evidence, DriveConfig, Frequency } from '../types';
import { 
  Folder, FolderOpen, FileText, Image, MoreVertical, Search, 
  Cloud, CloudOff, RefreshCw, ExternalLink, HardDrive, CheckCircle, Loader2,
  ChevronRight, ChevronDown, File, Filter
} from 'lucide-react';
import { SECTION_COLORS } from '../constants';

interface DocumentLibraryProps {
  project: Project;
  onConnectDrive: () => void;
  onSyncDrive: () => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ project, onConnectDrive, onSyncDrive }) => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Group Indicators by Section for the Tree View
  const sectionTree = useMemo(() => {
    const sections: Record<string, Indicator[]> = {};
    project.indicators.forEach(ind => {
      if (!sections[ind.section]) sections[ind.section] = [];
      sections[ind.section].push(ind);
    });
    return sections;
  }, [project.indicators]);

  // Flatten evidence based on selection
  const visibleEvidence = useMemo(() => {
    let evidenceList: { evidence: Evidence, indicatorName: string, section: string, frequency?: string }[] = [];
    
    project.indicators.forEach(ind => {
      // Filter logic
      if (selectedSection && ind.section !== selectedSection) return;
      if (selectedIndicatorId && ind.id !== selectedIndicatorId) return;

      ind.evidence.forEach(ev => {
        // Search logic
        if (searchQuery && !ev.fileName?.toLowerCase().includes(searchQuery.toLowerCase())) return;

        evidenceList.push({
          evidence: ev,
          indicatorName: ind.indicator,
          section: ind.section,
          frequency: ind.frequency
        });
      });
    });

    return evidenceList.sort((a, b) => new Date(b.evidence.dateUploaded).getTime() - new Date(a.evidence.dateUploaded).getTime());
  }, [project.indicators, selectedSection, selectedIndicatorId, searchQuery]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating Sync
    onSyncDrive();
    setIsSyncing(false);
  };

  const getFileIcon = (type: Evidence['type']) => {
    if (type === 'image') return <Image size={20} className="text-purple-500" />;
    if (type === 'document') return <FileText size={20} className="text-blue-500" />;
    if (type === 'link') return <ExternalLink size={20} className="text-slate-400" />;
    return <File size={20} className="text-slate-400" />;
  };

  const DriveStatus = () => {
    if (!project.driveConfig?.isConnected) {
        return (
            <div className="bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-700 rounded-lg"><CloudOff size={20} className="text-slate-400"/></div>
                    <div>
                        <h4 className="font-bold text-sm">Google Drive Not Connected</h4>
                        <p className="text-xs text-slate-400">Link an account to enable secure cloud backups.</p>
                    </div>
                </div>
                <button onClick={onConnectDrive} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-colors">
                    Connect Drive
                </button>
            </div>
        );
    }
    return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg"><Cloud size={20} className="text-emerald-600"/></div>
                <div>
                    <h4 className="font-bold text-sm text-slate-800">Backup Active: {project.driveConfig.accountName}</h4>
                    <p className="text-xs text-slate-500">Last Synced: {project.driveConfig.lastSync ? new Date(project.driveConfig.lastSync).toLocaleString() : 'Never'}</p>
                </div>
            </div>
            <button onClick={handleSync} disabled={isSyncing} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
        </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Document Library</h1>
                <p className="text-slate-500">Centralized storage for all compliance evidence and logs.</p>
            </div>
        </div>

        <div className="flex gap-6 h-full min-h-0">
            {/* Left Panel: Navigation Tree */}
            <div className="w-80 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm flex-shrink-0">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Folders</h3>
                    <button 
                        onClick={() => { setSelectedSection(null); setSelectedIndicatorId(null); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedSection ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <HardDrive size={16} /> Root (All Files)
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {(Object.entries(sectionTree) as [string, Indicator[]][]).map(([sectionName, inds]) => (
                        <div key={sectionName} className="mb-1">
                            <button 
                                onClick={() => setSelectedSection(selectedSection === sectionName ? null : sectionName)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50 ${selectedSection === sectionName ? 'text-slate-900' : 'text-slate-600'}`}
                            >
                                {selectedSection === sectionName ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                                <Folder size={16} className="text-amber-400 fill-amber-400" />
                                <span className="truncate">{sectionName}</span>
                                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 rounded-full">{inds.reduce((acc, i) => acc + i.evidence.length, 0)}</span>
                            </button>
                            
                            {selectedSection === sectionName && (
                                <div className="ml-4 pl-4 border-l border-slate-200 mt-1 space-y-1">
                                    {inds.map(ind => (
                                        <button 
                                            key={ind.id}
                                            onClick={() => setSelectedIndicatorId(ind.id === selectedIndicatorId ? null : ind.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-left ${selectedIndicatorId === ind.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                           <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0`} style={{ backgroundColor: SECTION_COLORS[sectionName] || '#cbd5e1' }}></div>
                                           <span className="truncate">{ind.indicator}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <DriveStatus />
                </div>
            </div>

            {/* Right Panel: File Grid */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium text-slate-800">Path:</span>
                        <span>AccrediFy / {project.name}</span>
                        {selectedSection && <><span>/</span><span>{selectedSection}</span></>}
                        {selectedIndicatorId && <><span>/</span><span className="truncate max-w-[150px]">Selected Indicator</span></>}
                    </div>
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Search files..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {visibleEvidence.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <FolderOpen size={48} className="text-slate-300 mb-4"/>
                            <p className="font-medium">No files found in this location.</p>
                            <p className="text-sm">Upload evidence in the Checklist or Upcoming Tasks to see them here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {visibleEvidence.map((item, idx) => (
                                <div key={item.evidence.id} className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                            {getFileIcon(item.evidence.type)}
                                        </div>
                                        {project.driveConfig?.isConnected && (
                                             <div title={item.evidence.syncStatus === 'synced' ? "Synced with Drive" : "Pending Sync"}>
                                                {item.evidence.syncStatus === 'synced' ? (
                                                    <Cloud size={16} className="text-emerald-500" />
                                                ) : (
                                                    <CloudOff size={16} className="text-slate-300" />
                                                )}
                                             </div>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-slate-800 text-sm truncate mb-1" title={item.evidence.fileName}>
                                        {item.evidence.fileName || 'Untitled Note'}
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-3 truncate">
                                        {new Date(item.evidence.dateUploaded).toLocaleDateString()}
                                    </p>
                                    
                                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-500 bg-slate-100 truncate max-w-[60%]`}>
                                            {item.frequency || 'One-Time'}
                                         </span>
                                         <a 
                                            href={item.evidence.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                         >
                                            View <ExternalLink size={10} />
                                         </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DocumentLibrary;
