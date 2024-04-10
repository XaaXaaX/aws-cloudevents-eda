import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { BuildSpec, ComputeType, LinuxArmBuildImage, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline, PipelineType, ProviderType } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction, CodeStarConnectionsSourceAction, S3DeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Rule } from "aws-cdk-lib/aws-events";
import { CodePipeline } from "aws-cdk-lib/aws-events-targets";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface CatalogPipelineStackProps extends StackProps {
  specsBucket: IBucket;
  websiteBucket: IBucket;
}

export class CatalogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: CatalogPipelineStackProps) {
    super(scope, id, props);
    
    const baseName = 'catalog';
    const githubActionName = 'GitHubSource';
    
    const codestarConnectionArn = StringParameter.fromStringParameterName(this, 'CodeStarConnectionArn', '/xaaxaaxx/codestar-connection/github/arn').stringValue;

    const artifactBucket = new Bucket(this, 'CatalogArtifactBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    let sourceArtifact = new Artifact("pipeline_artifact");
    let buildArtifact = new Artifact("pipeline_result_artifact");

    const pipeline = new Pipeline(this, 'CatalogPipeline', {
      artifactBucket: artifactBucket,
      pipelineName: baseName,
      pipelineType: PipelineType.V2,
    });

    const gitHubSourceAction = new CodeStarConnectionsSourceAction({
      owner: 'XaaXaaX',
      repo: 'aws-cloudevents-eda',
      connectionArn: codestarConnectionArn,
      output: sourceArtifact,
      actionName: githubActionName,
      branch: 'main'
    });

    pipeline.addTrigger({
      providerType: ProviderType.CODE_STAR_SOURCE_CONNECTION,
      gitConfiguration: {
        sourceAction: gitHubSourceAction,
        pushFilter: [
          {
            tagsIncludes: ['*'],
          },
        ],
      },
    })

    const buildproject = new PipelineProject(this, `CatalogPipelineBuild`, {
      buildSpec: BuildSpec.fromSourceFilename('./src/platform/buildspec.yml'),
      role: new Role(this, `CodebuildRole`, {
        assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
        roleName: `${baseName}-job-role`,
        inlinePolicies: {
          'deployment-pipeline-policy': new PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: ['ssm:GetParameter', 'ssm:GetParameters'],
                resources: ['*']
              }),
              new PolicyStatement({
                actions: ['s3:*'],
                resources: [props.specsBucket.bucketArn, `${props.specsBucket.bucketArn}/*`]
              }),
            ]
          })
        }
      }),
      environment: {
        buildImage: LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        computeType: ComputeType.SMALL
      },
      logging: {
        cloudWatch: {
          logGroup: new LogGroup(this, `CodebuildLogGroup`, {
            logGroupName: `/aws/codebuild/${baseName}_job`,
            retention: RetentionDays.ONE_MONTH,
          })
        }
      },
    });

    pipeline.addStage({
      stageName: githubActionName,
      actions: [
        gitHubSourceAction
      ]});

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          project: buildproject,
          actionName: 'Build_EventCatalog',
          input: sourceArtifact,
          outputs: [buildArtifact],
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new S3DeployAction({
          actionName: 'Deploy_EventCatalog',
          bucket: props.websiteBucket,
          input: buildArtifact,
          extract: true
        }),
      ]
    });

    new Rule(this, 'rule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: [
          'Object Created',
          'Object Deleted'
        ],
        resources: [
          props.specsBucket.bucketArn
        ]
      },
      targets: [
        new CodePipeline(pipeline)
      ]
    });
  }
}