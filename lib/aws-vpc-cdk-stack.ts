import * as cdk from "@aws-cdk/core";
import { Vpc, SecurityGroup, SubnetType, Port, Peer } from "@aws-cdk/aws-ec2";

export class AwsVpcCdkStack extends cdk.Stack {
  vpc: Vpc;
  ecsClusterSg: SecurityGroup;
  elbSg: SecurityGroup;
  efsSg: SecurityGroup;
  efsDevEc2Sg: SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define vpc
    const vpc = new Vpc(this, "VPC", {
      cidr: "172.17.0.0/16",
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "ingress",
          subnetType: SubnetType.PUBLIC
        }
      ]
    });

    // define security group
    const efsSg = new SecurityGroup(this, "efsSg", {
      securityGroupName: "efs-sg",
      vpc
    });
    const ecsClusterSg = new SecurityGroup(this, "ecsClusterSg", {
      securityGroupName: "ecs-cluster-sg",
      vpc
    });
    const elbSg = new SecurityGroup(this, "elbSg", {
      securityGroupName: "elb-sg",
      vpc
    });
    const efsDevEc2Sg = new SecurityGroup(this, "efsDevEc2Sg", {
      securityGroupName: "efs-dev-sg",
      vpc
    });
    const rdsSg = new SecurityGroup(this, "rdsSg", {
      securityGroupName: "rds-sg",
      vpc
    });

    // add ingress rules
    elbSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
    ecsClusterSg.addIngressRule(elbSg, Port.allTcp());
    ecsClusterSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
    efsSg.addIngressRule(ecsClusterSg, Port.tcp(2049));
    efsSg.addIngressRule(efsDevEc2Sg, Port.tcp(2049));
    rdsSg.addIngressRule(ecsClusterSg, Port.tcp(3306));

    // assign value to variable
    this.vpc = vpc;
    this.ecsClusterSg = ecsClusterSg;
    this.elbSg = elbSg;
    this.efsSg = efsSg;
    this.efsDevEc2Sg = efsDevEc2Sg;
  }
}
