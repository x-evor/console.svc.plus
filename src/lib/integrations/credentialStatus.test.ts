import {
  hasVaultBackedCredentialAccess,
  resolveCredentialReady,
} from '@/lib/integrations/credentialStatus'

describe('credentialStatus', () => {
  test('marks credentials ready when an inline token is present', () => {
    expect(
      resolveCredentialReady({
        inlineToken: 'live-token',
      }),
    ).toBe(true)
  })

  test('marks credentials ready when vault auth can resolve a locator-backed secret', () => {
    expect(
      resolveCredentialReady({
        vaultUrl: 'https://vault.svc.plus',
        vaultSecretPath: 'kv/team-a/openclaw',
        vaultAuthToken: 'vault-token',
      }),
    ).toBe(true)
  })

  test('keeps credentials pending when the vault locator is incomplete', () => {
    expect(
      hasVaultBackedCredentialAccess({
        vaultUrl: 'https://vault.svc.plus',
        vaultSecretPath: 'kv/team-a/openclaw',
        storedVaultAuthConfigured: false,
      }),
    ).toBe(false)
  })
})
