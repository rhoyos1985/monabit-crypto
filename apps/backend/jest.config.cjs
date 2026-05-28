/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          target: 'esnext',
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  // Coverage enfocado en lógica de negocio: use-cases + infrastructure adapters + shared utils.
  // Se excluyen capas que son glue (controllers, middlewares, routers Express) y archivos
  // declarativos (schemas Zod, swagger, scripts de bootstrap como migrations y seed-admin).
  collectCoverageFrom: [
    'src/modules/auth/application/use-cases.ts',
    'src/modules/auth/infrastructure/**/*.ts',
    'src/modules/users/application/use-cases.ts',
    'src/modules/users/infrastructure/**/*.ts',
    'src/modules/market/application/use-cases.ts',
    'src/modules/market/infrastructure/**/*.ts',
    'src/modules/preferences/infrastructure/**/*.ts',
    'src/modules/locations/infrastructure/**/*.ts',
    'src/shared/api-response.ts',
    'src/shared/http-error.ts',
    'src/shared/crypto-envelope.ts',
    '!src/**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
