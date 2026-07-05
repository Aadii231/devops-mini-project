variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment tag"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for tagging/naming resources"
  type        = string
  default     = "devops-mini-project"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium" # kind + docker need >= 2GB RAM, t3.medium is safer than t2.micro
}

variable "key_pair_name" {
  description = "Existing EC2 key pair name for SSH access"
  type        = string
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH into the instance (lock this down to your IP in real use)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "aws_profile" {
  description = "Optional AWS CLI profile name to use for Terraform (leave empty to use env credentials)."
  type        = string
  default     = ""
}
