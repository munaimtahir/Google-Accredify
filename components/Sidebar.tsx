
import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileBarChart, 
  Settings, 
  HelpCircle,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Grid,
  CalendarClock,
  FileCog,
  BrainCircuit,
  FolderOpen
} from 'lucide-react';
import { View } from '../App';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onSwitchProject: () => void;
  projectName?: string;
  isProjectActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, toggleSidebar, onSwitchProject, projectName, isProjectActive }) => {
  
  const globalItems = [
    { id: 'projects', label: 'All Projects', icon: Grid },
    { id: 'converter', label: 'CSV Converter', icon: FileCog }
  ] as const;
  
  const projectItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analysis', label: 'AI Analysis', icon: BrainCircuit },
    { id: 'library', label: 'Document Library', icon: FolderOpen },
    { id: 'upcoming', label: 'Upcoming Tasks', icon: CalendarClock },
    { id: 'checklist', label: 'Compliance Checklist', icon: CheckSquare },
    { id: 'reports', label: 'Reports & Audits', icon: FileBarChart },
    { id: 'ai', label: 'AI Assistant', icon: HelpCircle },
  ] as const;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:transform-none flex flex-col border-r border-slate-800 shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 text-sm">
                A
                </div>
                <span className="text-lg font-bold tracking-tight text-white">AccrediFy</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {globalItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as View);
                  if(item.id === 'projects') onSwitchProject();
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={`transition-colors ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300"></div>}
              </button>
            )
          })}

          {isProjectActive && (
            <>
              <div className="px-2 py-4">
                 <div className="h-px bg-slate-800"></div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4 mb-2">Current Project</p>
                 <p className="text-sm font-semibold text-white truncate px-1" title={projectName}>{projectName}</p>
              </div>

              {projectItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onChangeView(item.id as View);
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={`transition-colors ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300"></div>}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
           <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 group-hover:border-indigo-500 transition-colors">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">JD</span>
                  </div>
                  <div>
                      <p className="text-sm font-semibold text-white">John Doe</p>
                      <p className="text-xs text-slate-400 group-hover:text-indigo-300">Lab Director</p>
                  </div>
              </div>
              <div className="flex gap-1">
                <button className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <Settings size={12} /> Settings
                </button>
                <button className="py-1.5 px-3 text-xs text-slate-400 hover:text-red-300 bg-slate-700/50 hover:bg-red-900/20 rounded-lg flex items-center justify-center transition-all">
                    <LogOut size={12} />
                </button>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
