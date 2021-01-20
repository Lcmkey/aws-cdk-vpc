import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { Vpc, SecurityGroup, SubnetType, Port, Peer } from "@aws-cdk/aws-ec2";

export interface AwsCdkVpcStackProps extends StackProps {
  readonly prefix: string;
  readonly stage: string;
}

export class AwsCdkVpcStack extends Stack {
  readonly vpc: Vpc;
  readonly ecsClusterSg: SecurityGroup;
  readonly elbSg: SecurityGroup;
  readonly efsSg: SecurityGroup;
  readonly efsDevEc2Sg: SecurityGroup;
  readonly ingressSg: SecurityGroup;
  readonly egressSg: SecurityGroup;

  constructor(scope: Construct, id: string, props: AwsCdkVpcStackProps) {
    super(scope, id, props);

    /**
     * Get var from props
     */
    const { prefix, stage } = props;

    /**
     * Vpc Definition
     * Additionally, if you want to launch an RDS instance into your VPC,
     * make sure to set the property maxAzs to >=2 since RDS instances require at least two subnets each in a different AZ.
     */
    const vpc = new Vpc(this, `${prefix}-${stage}-Vpc`, {
      cidr: "172.17.0.0/16",
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "ingress",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 26,
          name: "isolatedSubnet",
          subnetType: SubnetType.ISOLATED,
        },
      ],
    });

    /**
     * Security Group Definitions
     */
    const efsSg = new SecurityGroup(this, `${prefix}-${stage}-EFS-SG`, {
      securityGroupName: `${prefix}-${stage}-EFS-SG`,
      vpc,
    });

    const ecsClusterSg = new SecurityGroup(
      this,
      `${prefix}-${stage}-ECS-Cluster-SG`,
      {
        securityGroupName: `${prefix}-${stage}-ECS-Cluster-SG`,
        vpc,
      },
    );

    const elbSg = new SecurityGroup(this, `${prefix}-${stage}-ECS-ELB-SG`, {
      securityGroupName: `${prefix}-${stage}-ECS-ELB-SG`,
      vpc,
    });

    const efsDevEc2Sg = new SecurityGroup(
      this,
      `${prefix}-${stage}-EFS-Dev-EC2-SG`,
      {
        securityGroupName: `${prefix}-${stage}-EFS-Dev-EC2-SG`,
        vpc,
      },
    );

    const rdsSg = new SecurityGroup(this, `${prefix}-${stage}-RDS-SG`, {
      securityGroupName: `${prefix}-${stage}-RDS-SG`,
      vpc,
    });

    const ingressSg = new SecurityGroup(this, `${prefix}-${stage}-Ingress-SG`, {
      vpc,
      allowAllOutbound: false,
      securityGroupName: `${prefix}-${stage}-Ingress-SG`,
    });

    const egressSg = new SecurityGroup(this, `${prefix}-${stage}-Egress-SG`, {
      vpc,
      allowAllOutbound: false,
      securityGroupName: `${prefix}-${stage}-Egress-SG`,
    });

    /**
     * Add ingress rules
     */
    elbSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
    ecsClusterSg.addIngressRule(elbSg, Port.allTcp());
    ecsClusterSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
    efsSg.addIngressRule(ecsClusterSg, Port.tcp(2049));
    efsSg.addIngressRule(efsDevEc2Sg, Port.tcp(2049));
    rdsSg.addIngressRule(ecsClusterSg, Port.tcp(3306));
    ingressSg.addIngressRule(Peer.ipv4("172.17.0.0/16"), Port.tcp(3306));
    egressSg.addEgressRule(Peer.anyIpv4(), Port.tcp(80));

    /**
     * Assign value to variable
     */
    this.vpc = vpc;
    this.ecsClusterSg = ecsClusterSg;
    this.elbSg = elbSg;
    this.efsSg = efsSg;
    this.efsDevEc2Sg = efsDevEc2Sg;
    this.ingressSg = ingressSg;
    this.egressSg = egressSg;
  }
}
