import alias from '@rollup/plugin-alias';
import jst from 'rollup-plugin-jst';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import reactSvg from "rollup-plugin-react-svg";

const pageflowPackageRoot = 'package';
const pageflowPagedEngineRoot = 'entry_types/paged';
const pageflowPagedPackageRoot = pageflowPagedEngineRoot + '/packages/pageflow-paged';
const pageflowScrolledPackageRoot = 'entry_types/scrolled/package';

const frontendGlobals = {
  'backbone': 'Backbone',
  'jquery': 'jQuery',
  'jquery-ui': 'jQuery',
  'underscore': '_',
  'i18n-js': 'I18n',
  'iscroll': 'IScroll',
  'videojs': 'VideoJS',
};

const editorGlobals = {
  ...frontendGlobals,
  'backbone.babysitter': 'Backbone.ChildViewContainer',
  'cocktail': 'Cocktail',
  'jquery.minicolors': 'jQuery',
  'backbone.marionette': 'Backbone.Marionette',
  'wysihtml5': 'wysihtml5'
};

function external(id) {
  // Make all import external except
  // - relative path
  // - absolute paths (generated by @babel/plugin-transform-runtime
  //   for helper modules and the alias plugin below)
  // - aliases like $state
  return !['.', '/', '$'].includes(id[0]);
}

const plugins = [
  postcss({
    modules: true,
    plugins: [autoprefixer]
  }),
  babel({
    exclude: 'node_modules/**',
    extensions: ['js', 'jsx', 'svg'],

    // By default rollup-plugin-babel deduplicates runtime helpers
    // inserted by Babel. babel-preset-react-app uses
    // @babel/plugin-transform-runtime which already takes care of
    // this.
    runtimeHelpers: true
  }),
  jst(),
  resolve(),
  commonjs(),
  reactSvg({
    svgo: {multipass: true}
  })
];

function stateAlias(path) {
  return alias({
    entries: {
      '$state': __dirname + '/' + path,
    }
  });
}

const ignoreJSXWarning = {
  onwarn: function(warning, warn) {
    // Ignore noisy warning
    // https://github.com/babel/babel/issues/9149
    if (warning.code === 'THIS_IS_UNDEFINED') { return; }
    warn(warning);
  }
};

// pageflow

const pageflow = [
  {
    input: pageflowPackageRoot + '/src/ui/index.js',
    output: {
      file: pageflowPackageRoot + '/ui.js',
      format: 'esm'
    },
    external,
    plugins
  },
  {
    input: pageflowPackageRoot + '/src/editor/index.js',
    output: {
      file: pageflowPackageRoot + '/editor.js',
      format: 'esm'
    },
    external,
    plugins: [
      stateAlias(pageflowPackageRoot + '/src/editor/state.js'),
      ...plugins
    ]
  },
  {
    input: pageflowPackageRoot + '/src/testHelpers/index.js',
    output: {
      file: pageflowPackageRoot + '/testHelpers.js',
      format: 'esm'
    },
    external,
    plugins: [
      stateAlias(pageflowPackageRoot + '/src/editor/state.js'),
      ...plugins
    ]
  },
  {
    input: pageflowPackageRoot + '/src/frontend/index.js',
    output: {
      file: pageflowPackageRoot + '/frontend.js',
      format: 'esm',
      globals: {'videojs': 'VideoJS'}
    },
    external,
    plugins
  },
  {
    input: pageflowPackageRoot + '/src/ui/index.js',
    output: {
      file: 'app/assets/javascripts/pageflow/dist/ui.js',
      format: 'iife',
      name: 'pageflow._uiGlobalInterop',
      globals: editorGlobals
    },
    external: Object.keys(editorGlobals),
    plugins
  }
];

// pageflow-paged

const pageflowPagedEditorGlobals = {
  ...editorGlobals,

  // Allow importing from pageflow/frontend and
  // pageflow-paged/frontend without including all of
  // the frontend code in the editor output.
  'pageflow/frontend': 'pageflow',
  'pageflow-paged/frontend': 'pageflow'
}

const pageflowPaged = [
  {
    input: pageflowPagedPackageRoot + '/src/editor/index.js',
    output: {
      file: pageflowPagedEngineRoot + '/app/assets/javascripts/pageflow_paged/dist/editor.js',
      format: 'iife',
      name: 'pageflow_paged',
      globals: pageflowPagedEditorGlobals
    },
    external: Object.keys(pageflowPagedEditorGlobals),
    plugins: [
      stateAlias(pageflowPagedPackageRoot + '/src/editor/state.js'),
      ...plugins
    ]
  },
  {
    input: pageflowPagedPackageRoot + '/src/frontend/index.js',
    output: {
      file: pageflowPagedEngineRoot + '/app/assets/javascripts/pageflow_paged/dist/frontend.js',
      format: 'iife',
      name: 'pageflow_paged.frontend',
      globals: frontendGlobals
    },
    external: Object.keys(frontendGlobals),
    plugins
  }
];

// pageflow-scrolled

const pageflowScrolled = [
  {
    input: pageflowScrolledPackageRoot + '/src/editor/index.js',
    output: {
      file: pageflowScrolledPackageRoot + '/editor.js',
      format: 'esm',
    },
    external,
    plugins
  },
  {
    input: pageflowScrolledPackageRoot + '/src/frontend/index.js',
    output: {
      dir: pageflowScrolledPackageRoot + '/frontend',
      format: 'esm',
    },
    external,
    plugins,
    ...ignoreJSXWarning
  },

  {
    input: pageflowScrolledPackageRoot + '/src/contentElements/editor.js',
    output: {
      file: pageflowScrolledPackageRoot + '/contentElements-editor.js',
      format: 'esm',
    },
    external,
    plugins
  },
  {
    input: pageflowScrolledPackageRoot + '/src/contentElements/frontend.js',
    output: {
      file: pageflowScrolledPackageRoot + '/contentElements-frontend.js',
      format: 'esm',
    },
    external,
    plugins,
    ...ignoreJSXWarning
  }
];

export default [
  ...pageflow,
  ...pageflowPaged,
  ...pageflowScrolled
]
