output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.devops_ec2.id
}

output "public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.devops_ec2.public_ip
}

output "public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.devops_ec2.public_dns
}

output "ansible_inventory_hint" {
  description = "Copy this into ansible/inventory.ini"
  value       = "[dev]\n${aws_instance.devops_ec2.public_ip} ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/${var.key_pair_name}.pem"
}
