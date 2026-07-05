# DevOps Mini Project — MERN Blog on EC2 + kind

End-to-end DevOps pipeline for a MERN app (client + server + MongoDB):
Terraform → Ansible → Docker → kind (Kubernetes) → GitHub Actions CI/CD →
Prometheus/Grafana → S3 Backup/DR.

## Repo layout

```
terraform/    EC2 instance, SG, IAM role (for S3), on default VPC
ansible/      Installs Docker, Nginx, kind, kubectl, AWS CLI; sets up cron backup
k8s/          Namespace, MongoDB (PVC), backend, frontend manifests + kind-config.yaml
.github/workflows/ci-cd.yml   Build -> push to Docker Hub -> deploy to kind on EC2
monitoring/   Prometheus + Grafana + node-exporter (docker-compose, runs on EC2 host)
backup/       backup.sh (mongodump -> S3), restore.sh (S3 -> mongorestore, DR test)
```

Your actual app code (`client/`, `server/`) stays in your existing repo structure —
just add this scaffolding alongside it (drop `k8s/`, `terraform/`, `ansible/`,
`.github/`, `monitoring/`, `backup/` into the root of your repo, next to
`client/` and `server/`).

## One required backend change: add a `/metrics` endpoint

Your CI/CD, Kubernetes, and monitoring are already wired for this — but your
`server.js` currently has no `/metrics` route, so Prometheus can't scrape app
metrics yet. Add this to `server/`:

```bash
npm install prom-client
```

In `server.js`, near the top (after `express()` is created) add:

```js
import client from "prom-client";

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});
```

That's the only app-code change needed anywhere in this project.

---

## Step 1 — Terraform: provision the EC2 dev instance

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set key_pair_name (must already exist in AWS) and ssh_cidr (your IP/32)

terraform init
terraform plan
terraform apply
```

Grab the output:
```bash
terraform output public_ip
```

> Requires AWS credentials locally (`aws configure`) with EC2/IAM permissions.
> Also requires an existing EC2 key pair (create one in the AWS console or via
> `aws ec2 create-key-pair`) so you can SSH in.

## Step 2 — Ansible: configure the instance

```bash
cd ../ansible
cp inventory.ini.example inventory.ini
# edit inventory.ini: put the EC2 public IP + your .pem key path

ansible-playbook playbook.yml
```

This installs Docker, Nginx (reverse proxy → app), kubectl, kind, AWS CLI,
creates the `devops-cluster` kind cluster, and schedules the nightly backup
cron job.

SSH in and sanity check:
```bash
ssh -i ~/.ssh/my-ec2-keypair.pem ec2-user@<EC2_PUBLIC_IP>
kind get clusters          # should show: devops-cluster
kubectl get nodes
```

## Step 3 — First deploy (manual, before CI/CD is set up)

From your laptop or the EC2 box (with KUBECONFIG pointed at the kind cluster):
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/10-mongodb.yaml

# For the very first apply, replace IMAGE_TAG with a real tag you've pushed,
# e.g. "latest", since CI/CD hasn't run yet:
sed 's/IMAGE_TAG/latest/g' k8s/20-backend.yaml  | kubectl apply -f -
sed 's/IMAGE_TAG/latest/g' k8s/30-frontend.yaml | kubectl apply -f -

kubectl get pods -n mern-blog -w
```

Build/push your images manually once first so a `:latest` tag exists on Docker Hub:
```bash
docker build -t adnanshakeel231/backend:latest ./server
docker push adnanshakeel231/backend:latest

docker build --build-arg VITE_API_URL=http://<EC2_PUBLIC_IP>:5001 \
  -t adnanshakeel231/frontend:latest ./client
docker push adnanshakeel231/frontend:latest
```

Visit `http://<EC2_PUBLIC_IP>` (via Nginx) or `http://<EC2_PUBLIC_IP>:3000` (direct).

## Step 4 — CI/CD (GitHub Actions)

Add these repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | contents of your `.pem` private key |
| `VITE_API_URL` | `http://<EC2_PUBLIC_IP>:5001` (baked into the frontend build) |

Push to `main` → the workflow builds both images tagged with the git short
SHA, pushes to Docker Hub, then SSHes into EC2 and applies the manifests
with that tag, waiting for rollout.

To bump a version manually: go to **Actions → CI-CD → Run workflow** and
supply a custom `version_tag`, or just push a new commit — the short SHA
becomes the new image tag automatically, giving you a clean version-change
pipeline.

## Step 5 — Monitoring (Prometheus + Grafana)

On the EC2 instance:
```bash
cd monitoring
docker compose -f docker-compose-monitoring.yml up -d
```

- Prometheus: `http://<EC2_PUBLIC_IP>:9090/targets` — confirm `node-exporter`
  and `backend-app` targets are **UP**.
- Grafana: `http://<EC2_PUBLIC_IP>:3001` (admin/admin, change on first login).
  Prometheus datasource is auto-provisioned. Import dashboard ID **1860**
  ("Node Exporter Full") for instance-level metrics; build a simple panel on
  `http_requests_total` for app-level metrics.

## Step 6 — Backup & Disaster Recovery

1. Create the S3 bucket (either via `backup/s3-bucket.tf` or manually):
   ```bash
   cd backup
   terraform init && terraform apply
   ```
   Note the bucket name and update `S3_BUCKET` in `backup.sh`/`restore.sh`
   if you didn't use the default name.

2. Run a backup manually to test:
   ```bash
   ssh ec2-user@<EC2_PUBLIC_IP>
   ./backup.sh
   ```
   Confirm the `.gz` archive lands in S3:
   ```bash
   aws s3 ls s3://my-devops-mini-project-backups/
   ```

3. Test the restore (DR drill) — restores into a separate `blog_restore_test`
   DB so it never overwrites live data:
   ```bash
   ./restore.sh
   ```

Cron runs `backup.sh` nightly at 2 AM (set up by Ansible).

## Step 7 — Screenshots/demo checklist

- [ ] `terraform apply` output showing EC2 running + `aws ec2 describe-instances`
- [ ] `kind get clusters` + `kubectl get pods -n mern-blog -o wide`
- [ ] App loading in browser (frontend + an API call succeeding)
- [ ] GitHub Actions run: green build → push → deploy, for two different commits (version change)
- [ ] Prometheus `/targets` page, both targets UP
- [ ] Grafana dashboard with live data
- [ ] `aws s3 ls` showing backup objects, and `restore.sh` output showing restored doc counts
