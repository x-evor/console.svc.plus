'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Card from '../../components/Card'
import { fetchAgentNodes } from '../../lib/fetchAgentNodes'
import type { VlessNode } from '../../lib/vless'

export default function SandboxNodeBindingPanel() {
  const { data: nodes, error, isLoading } = useSWR<VlessNode[]>('user-center-agent-nodes', fetchAgentNodes, {
    revalidateOnFocus: false,
  })
  const [message, setMessage] = useState<string | null>(null)

  const [activeBinding, setActiveBinding] = useState<{ address: string; updatedAt?: number } | null>(null)
  const [draftAddress, setDraftAddress] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Initial load from server to stay in sync
    fetch('/api/admin/sandbox/binding')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.address === 'string') {
          setDraftAddress(data.address)
          setActiveBinding({
            address: data.address,
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
          })
        }
      })
      .catch(err => console.error('Failed to fetch binding from server', err))
  }, [])

  const isChanged = useMemo(() => {
    return (activeBinding?.address ?? '') !== draftAddress
  }, [activeBinding?.address, draftAddress])

  const handleApply = async (rawAddress: string) => {
    const address = rawAddress.trim()
    try {
      setIsSaving(true)
      setMessage(null)
      const response = await fetch('/api/admin/sandbox/bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message || `Failed to save binding (${response.status})`)
      }

      if (!address) {
        setActiveBinding({ address: '', updatedAt: Date.now() })
        setMessage('已成功清空绑定节点 (已同步至服务器)')
      } else {
        const node = nodes?.find((item) => item.address === address)
        setActiveBinding({ address, updatedAt: Date.now() })
        setMessage(`应用成功：已绑定至 ${node?.name || address} (已同步至服务器)`)
      }

      // Refresh local state if needed (though we already updated it)
    } catch (err: any) {
      setMessage(`错误：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const currentActive = activeBinding?.address ? activeBinding : null

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Root 管理员专用：Sandbox Node 绑定节点</h2>
          <p className="text-sm text-gray-600">选择并“确认应用”后，Sandbox@svc.plus 将固定使用该节点生成配置。</p>
        </div>

        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-gray-700">
            选择目标节点
            <select
              value={draftAddress}
              disabled={isLoading || !nodes}
              onChange={(e) => {
                const next = e.target.value
                setDraftAddress(next)
                // 两段式：先选择，再点“确认应用”提交到服务器
                setMessage(null)
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">不绑定（清空）</option>
              {(nodes ?? [])
                .filter((node) => node.address !== '*')
                .map((node) => (
                  <option key={node.address} value={node.address}>
                    {node.name} ({node.address})
                  </option>
                ))}
            </select>
          </label>

          <button
            onClick={() => void handleApply(draftAddress)}
            disabled={!isChanged || isSaving}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isChanged
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isSaving ? '保存中…' : '确认应用'}
          </button>
        </div>

        <div className="space-y-1 rounded-md bg-gray-50 p-3">
          {currentActive ? (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              当前活跃绑定：<span className="font-bold">{currentActive.address}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="h-2 w-2 rounded-full bg-gray-300" />
              当前未绑定任何节点
            </div>
          )}
          {currentActive?.updatedAt ? (
            <p className="pl-4 text-[10px] text-gray-400">
              最后更新时间：{new Date(currentActive.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        {error && <p className="text-xs text-red-600">⚠️ 节点列表加载失败：{error.message}</p>}
        {message && (
          <p className={`text-xs font-medium ${message.startsWith('错误') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </Card>
  )
}
