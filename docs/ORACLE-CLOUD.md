# Oracle Cloud Infrastructure (OCI) — Montreal / Always Free

Deploy completo: **MySQL + API + Web** em uma VM com Docker.

## Pré-requisitos

1. Conta [Oracle Cloud](https://cloud.oracle.com) (Always Free elegível)
2. VM **Ampere A1** (recomendado: 2 OCPU, 12 GB RAM) em `ca-montreal-1` ou outra região
3. Imagem: **Ubuntu 22.04** ou **Oracle Linux 8**
4. Repositório no GitHub com o código atualizado

## 1. Criar a VM (Console OCI)

1. **Compute** → **Instances** → **Create instance**
2. Name: `afu-mobile`
3. Image: Ubuntu 22.04
4. Shape: `VM.Standard.A1.Flex` (Always Free) — 2 OCPU, 12 GB
5. Networking: assign **public IPv4**
6. SSH key: gere ou cole sua chave pública
7. Create

### Security List (firewall OCI)

Na VCN da VM, em **Security Lists** → Ingress Rules:

| Source | Protocol | Port | Descrição |
|--------|----------|------|-----------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 80 | HTTP (app web) |
| `0.0.0.0/0` | TCP | 443 | HTTPS (opcional, depois do certificado) |

## 2. Instalar Docker na VM

SSH na VM:

```bash
ssh ubuntu@SEU_IP_PUBLICO
```

```bash
sudo apt-get update
sudo apt-get install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
sudo apt-get install -y docker-compose-plugin
```

## 3. Clonar e configurar

```bash
git clone https://github.com/ivansobierai-cyber/afu-mobile-v2.git
cd afu-mobile-v2
cp .env.oci.example .env.oci
nano .env.oci   # troque MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, JWT_SECRET
```

## 4. Deploy

```bash
chmod +x scripts/oci-deploy.sh
./scripts/oci-deploy.sh
```

Na primeira subida, `SEED_ON_START=1` cria contas demo. Depois edite `.env.oci`:

```bash
SEED_ON_START=0
```

E reinicie só a API:

```bash
docker compose --env-file .env.oci -f docker-compose.oci.yml up -d api
```

## 5. Testar

```bash
curl http://SEU_IP/api/health
```

No navegador do celular: `http://SEU_IP/`

## Cloud Shell (limitado)

O [Cloud Shell](https://cloud.oracle.com/?region=ca-montreal-1&cloudshell=true) **não** substitui uma VM para hospedar o app 24/7 — é um terminal temporário sem IP público persistente para containers.

Use o Cloud Shell apenas para:
- `oci` CLI (criar VM, abrir portas)
- SSH na VM: `ssh ubuntu@IP`

## Atualizar versão

```bash
cd afu-mobile-v2
git pull
./scripts/oci-deploy.sh
```

## APK / app mobile apontando para OCI

No `eas.json`, profile preview (ou novo `oci`):

```json
"EXPO_PUBLIC_API_BASE_URL": "http://SEU_IP_PUBLICO"
```

Depois: `npm run eas:android:preview`

> Para produção, use domínio + HTTPS (Let's Encrypt no nginx ou Load Balancer OCI).

## Comandos úteis

```bash
docker compose -f docker-compose.oci.yml ps
docker compose -f docker-compose.oci.yml logs -f api
docker compose -f docker-compose.oci.yml logs -f web
docker compose -f docker-compose.oci.yml down
```

## Migração desde Railway / Vercel

| Antes | OCI |
|-------|-----|
| Railway API | `http://IP/api` |
| Vercel Web | `http://IP/` |
| Railway MySQL | MySQL no container `mysql` |

Pode manter Railway/Vercel em paralelo até validar o OCI.
