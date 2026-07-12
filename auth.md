# auth.md

Joyfully Present Life Coaching supports agent-native authentication, allowing AI agents to register and act on behalf of our users. We support both Agent Verified and User Claimed registration flows.

## Discovery
Agents can discover our authentication requirements via our Protected Resource Metadata:
`https://joyfullypresent.life/.well-known/oauth-protected-resource`

## Supported Registration Flows

### 1. Agent Verified Flow (Preferred)
Trusted agent providers can attest to a user's identity using an ID-JAG assertion.
- **Endpoint:** `POST /agent-auth`
- **Mechanism:** Present the ID-JAG assertion to the endpoint. We will verify the signature against the provider's JWKS and JIT-provision the user.

### 2. User Claimed Flow
For agents without a verified identity provider, we use a code-confirmation claim ceremony.
- **Flow:** The agent initiates the claim request. We will provide a one-time code for the user to confirm via our web portal.
- **Completion:** Once confirmed, the agent exchanges the claim token for standard OAuth credentials.

## API Access
Once registered, agents must use standard OAuth 2.0 access tokens.
- **Token Endpoint:** `https://accounts.joyfullypresent.life/oauth2/token`
- **Scopes Supported:** `coaching:read`, `coaching:write`, `appointments:manage`

## Revocation
We support OIDC backchannel logout for credential revocation.
