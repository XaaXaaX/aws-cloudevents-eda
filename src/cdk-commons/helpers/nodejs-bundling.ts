import { Architecture, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
export const EsbuildNodeBundling = {
  platform: 'node',
  format: OutputFormat.CJS,
  mainFields: ['module', 'main'],
  minify: true,
  sourceMap: true,
  sourcesContent: false,
  sourceMapMode: SourceMapMode.INLINE,
  externalModules: [ '@aws-sdk' ],
}

export const LambdaConfiguration = {
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
  loggingFormat: LoggingFormat.JSON,
  systemLogLevel: 'WARN',
  applicationLogLevel: 'INFO',
  bundling: EsbuildNodeBundling,
}