terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: use an S3 backend for team use.
  # backend "s3" {
  #   bucket = "my-devops-tfstate-bucket"
  #   key    = "dev/ec2/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

locals {
  aws_profile = var.aws_profile != "" ? var.aws_profile : null
}

provider "aws" {
  region  = var.aws_region
  profile = local.aws_profile
}
