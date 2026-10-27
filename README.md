# Tarefas API: Docker, Docker Compose e Kubernetes

Projeto prático do seminário **Containers, Docker e Kubernetes**.

A **Tarefas API** é uma API REST em Node.js (Express) que cadastra e lista tarefas em um banco PostgreSQL. O mesmo código é executado nas três camadas estudadas:

1. **Docker**: a aplicação empacotada em uma imagem.
2. **Docker Compose**: API + banco orquestrados em uma máquina, com dados persistentes.
3. **Kubernetes**: a API com 3 réplicas, auto-recuperação e escalonamento.

## Estrutura do projeto

```
tarefas-api/
├── app/
│   ├── Dockerfile       # imagem node:24-alpine, dependências de produção, usuário sem privilégios
│   ├── .dockerignore
│   ├── package.json     # dependências: express e pg
│   └── server.js        # a API
├── compose.yaml         # serviços api + db, healthcheck e volume "dados"
├── k8s/
│   ├── app.yaml         # Deployment (3 réplicas, readinessProbe, limites) + Service
│   └── postgres.yaml    # Deployment + Service do PostgreSQL
└── evidencias/
    └── evidencias.txt   # saída dos comandos da validação
```

## A API

| Método | Rota       | Descrição                                       |
|--------|------------|-------------------------------------------------|
| GET    | `/saude`   | Verifica a API e a conexão com o banco          |
| GET    | `/tarefas` | Lista as tarefas                                |
| POST   | `/tarefas` | Cria uma tarefa. Corpo: `{"titulo": "..."}`     |

Ao iniciar, a API cria a tabela `tarefas` (`id`, `titulo`, `concluida`). Se o banco ainda não estiver pronto, ela tenta de novo a cada 2 segundos.

## Como executar (Windows / PowerShell)

Pré-requisitos: Docker Desktop (com WSL 2), kubectl e minikube.

### 1. Docker
```powershell
docker build -t tarefas-api:1.0 ./app
docker image ls tarefas-api
```

### 2. Docker Compose
```powershell
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:3000/saude
Invoke-RestMethod -Method Post http://localhost:3000/tarefas -ContentType 'application/json' -Body '{"titulo":"Estudar Kubernetes"}'
Invoke-RestMethod http://localhost:3000/tarefas
docker compose down; docker compose up -d     # os dados permanecem (volume "dados")
docker compose down -v                        # remove também o volume
```

### 3. Kubernetes (minikube)
```powershell
minikube start --driver=docker
minikube image load tarefas-api:1.0
kubectl apply -f k8s/
kubectl get pods -w                                   # aguarde 1/1 Running
kubectl port-forward svc/tarefas-api 8080:80          # em outro terminal
Invoke-RestMethod http://localhost:8080/saude

# Auto-recuperação: apague um Pod e veja outro ser criado
kubectl get pods -l app=tarefas-api
kubectl delete pod <nome-de-um-pod>
kubectl get pods -l app=tarefas-api

# Escalonamento
kubectl scale deployment tarefas-api --replicas=5
kubectl get pods -l app=tarefas-api

# Limpeza
kubectl delete -f k8s/
minikube stop
```

## Validação realizada

O projeto foi executado e validado em Windows 11 com Docker 29.9.1 (WSL 2), Docker Compose v5.6.0, kubectl v1.36.1 e minikube v1.39.0 (Kubernetes v1.37.0).

- **Docker:** imagem `tarefas-api:1.0` criada (266 MB).
- **Compose:** API e banco no ar, rotas testadas. A tarefa criada continuou existindo depois de `docker compose down` e `up`, o que comprova a persistência no volume.
- **Kubernetes:** 3 Pods da API e 1 do banco em `1/1 Running`. As rotas foram testadas por `port-forward`.
- **Auto-recuperação:** um Pod apagado foi substituído automaticamente pelo Deployment.
- **Escalonamento:** o Deployment foi para `5/5` réplicas com `kubectl scale`.

As saídas dos comandos estão em [`evidencias/evidencias.txt`](evidencias/evidencias.txt).

## Observações

- As credenciais do banco ficam no próprio arquivo e o PostgreSQL no Kubernetes não tem volume persistente. As duas escolhas são **apenas didáticas**. Em produção, as credenciais ficariam em um *Secret* e os dados em um *PersistentVolumeClaim*.
