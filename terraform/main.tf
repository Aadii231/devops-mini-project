# Use the default VPC to keep this "mini project" simple.
# In production, use a dedicated VPC module instead.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# -------------------------------------------------------------------
# 1. Official Ubuntu 24.04 LTS AMI Data Source
# -------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Official Ubuntu Owner ID)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -------------------------------------------------------------------
# 2. Automated Safe SSH Key Pair Creation 
#    (Generates a new key pair and saves the file locally automatically)
# -------------------------------------------------------------------
resource "tls_private_key" "devops_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "devops_key_pair" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = tls_private_key.devops_key.public_key_openssh
}

resource "local_file" "ssh_key" {
  content  = tls_private_key.devops_key.private_key_pem
  filename = "${path.module}/${var.project_name}-${var.environment}-key.pem"
}

# -------------------------------------------------------------------
# 3. Security Groups
# -------------------------------------------------------------------
resource "aws_security_group" "devops_sg" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "SG for DevOps mini project EC2 instance"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  # HTTP (nginx / app)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # App NodePort range (kind exposes services here via extraPortMappings)
  ingress {
    description = "App NodePort"
    from_port   = 30000
    to_port     = 30100
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana
  ingress {
    description = "Grafana"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus
  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Node exporter
  ingress {
    description = "Node Exporter"
    from_port   = 9100
    to_port     = 9100
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg"
    Environment = var.environment
  }
}

# -------------------------------------------------------------------
# 4. IAM Execution Roles & Profiles
# -------------------------------------------------------------------
resource "aws_iam_role" "ec2_backup_role" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_s3_backup_policy" {
  name = "${var.project_name}-${var.environment}-s3-backup-policy"
  role = aws_iam_role.ec2_backup_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Resource = [
        "arn:aws:s3:::*devops-mini-project-backups",
        "arn:aws:s3:::*devops-mini-project-backups/*"
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_backup_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_backup_role.name
}

# -------------------------------------------------------------------
# 5. EC2 Instance Provisioning
# -------------------------------------------------------------------
resource "aws_instance" "devops_ec2" {
  ami                    = data.aws_ami.ubuntu.id # Swapped to Ubuntu
  instance_type          = var.instance_type
  key_name               = aws_key_pair.devops_key_pair.key_name # Swapped to new automated key
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.devops_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_backup_profile.name

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }

  # Boostrap script adapted for clean Ubuntu installations
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y python3 python3-pip git
    
    # Allocating 2G swap to guarantee stable performance for kind cluster
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
  EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2"
    Environment = var.environment
  }
}