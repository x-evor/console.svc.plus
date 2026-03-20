type CredentialStatusInput = {
  inlineToken?: string
  storedTokenConfigured?: boolean
  vaultUrl?: string
  vaultSecretPath?: string
  vaultAuthToken?: string
  storedVaultAuthConfigured?: boolean
}

function hasText(value?: string): boolean {
  return Boolean(value?.trim())
}

export function hasVaultBackedCredentialAccess(
  input: Pick<
    CredentialStatusInput,
    'vaultUrl' | 'vaultSecretPath' | 'vaultAuthToken' | 'storedVaultAuthConfigured'
  >,
): boolean {
  return (
    hasText(input.vaultUrl) &&
    hasText(input.vaultSecretPath) &&
    (hasText(input.vaultAuthToken) || Boolean(input.storedVaultAuthConfigured))
  )
}

export function resolveCredentialReady(input: CredentialStatusInput): boolean {
  return (
    Boolean(input.storedTokenConfigured) ||
    hasText(input.inlineToken) ||
    hasVaultBackedCredentialAccess(input)
  )
}
