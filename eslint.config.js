import ts from 'typescript-eslint';
export default [...ts.configs.recommended, { ignores: ['dist','node_modules'] }];
