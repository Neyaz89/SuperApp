const { withProjectBuildGradle } = require('@expo/config-plugins');

const withFixIronSource = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('ironsource-mediation')) {
      // Add Kotlin compiler options to handle the currentActivity issue
      const kotlinOptions = `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += ["-Xjvm-default=all"]
        }
    }
}
`;
      
      if (!config.modResults.contents.includes('Xjvm-default')) {
        config.modResults.contents = config.modResults.contents + '\n' + kotlinOptions;
      }
    }
    return config;
  });
};

module.exports = withFixIronSource;
