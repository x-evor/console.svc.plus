import Breadcrumbs from '@/app/panel/components/Breadcrumbs'

import { IntegrationsConsole } from '../components/IntegrationsConsole'

export default function UserCenterApiRoute() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/panel' },
          { label: 'Integrations', href: '/panel/api' },
        ]}
      />
      <IntegrationsConsole />
    </div>
  )
}
