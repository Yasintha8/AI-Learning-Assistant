import React from 'react'

const PageHeader = ({ title, subtitle, children }) => {
    return (
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-text-heading tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-text-muted">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    )
}

export default PageHeader