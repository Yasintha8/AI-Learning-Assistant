import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
    return <div className="flex flex-col gap-6">
        <div className="border-b border-border-medium">
            <nav className="flex items-end gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`relative pb-3 px-2 md:px-6 text-sm font-semibold transition-all duration-200 rounded-t-lg cursor-pointer
                            ${activeTab === tab.name
                                ? 'text-primary'
                                : 'text-text-muted hover:text-text-body hover:bg-border-light'
                            }`}
                    >
                        <span className="relative z-10">{tab.label}</span>

                        {/* Active underline indicator */}
                        {activeTab === tab.name && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 rounded-full" />
                        )}

                        {/* Active background glow */}
                        {activeTab === tab.name && (
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/2 to-transparent rounded-t-lg z-10" />
                        )}
                    </button>
                ))}
            </nav>
        </div>
        <div className="py-2">
            {tabs.map((tab) => {
                if (tab.name === activeTab) {
                    return (
                        <div
                            key={tab.name}
                            className="animate-fade-in duration-300"
                        >
                            {tab.content}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    </div>
};

export default Tabs;