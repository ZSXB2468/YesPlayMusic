const webpack = require('webpack');
const path = require('path');
function resolve(dir) {
  return path.join(__dirname, dir);
}

// 根据环境变量决定构建配置
const isNightlyBuild = process.env.NIGHTLY_BUILD === 'true';
const isGithubAction = process.env.GITHUB_ACTIONS_BUILD === 'true';

// 夜间构建简化配置
const nightlyTargets = {
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64', 'universal'],
      },
    ],
    artifactName: '${productName}-${os}-${version}-${arch}.${ext}',
    category: 'public.app-category.music',
    darkModeSupport: true,
  },
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    publisherName: 'YesPlayMusic',
    icon: 'build/icons/icon.ico',
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
    ],
    category: 'Music',
    icon: './build/icon.icns',
  },
};

// 完整构建配置
const fullTargets = {
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64', 'universal'],
      },
    ],
    artifactName: '${productName}-${os}-${version}-${arch}.${ext}',
    category: 'public.app-category.music',
    darkModeSupport: true,
  },
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64', 'ia32', 'arm64'],
      },
      {
        target: 'nsis',
        arch: ['x64', 'ia32', 'arm64'],
      },
      {
        target: 'msi',
        arch: ['x64', 'ia32', 'arm64'],
      }
    ],
    publisherName: 'YesPlayMusic',
    icon: 'build/icons/icon.ico',
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'tar.gz',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'rpm',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'flatpak',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'pacman',
        arch: ['x64', 'arm64', 'armv7l'],
      },
    ],
    category: 'Music',
    icon: './build/icon.icns',
  },
};

// GithubActions构建配置
const actionTargets = {
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64', 'universal'],
      },
    ],
    artifactName: '${productName}-${os}-${version}-${arch}.${ext}',
    category: 'public.app-category.music',
    darkModeSupport: true,
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64'],
      },
    ],
    publisherName: 'YesPlayMusic',
    icon: 'build/icons/icon.ico',
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64', 'armv7l'],
      },
      {
        target: 'rpm',
        arch: ['x64', 'arm64', 'armv7l'],
      },
    ],
    category: 'Music',
    icon: './build/icon.icns',
  },
};

const buildTargets = isNightlyBuild ? nightlyTargets : (isGithubAction ? actionTargets : fullTargets);


module.exports = {
  // 生产环境打包不输出 map
  productionSourceMap: false,
  devServer: {
    disableHostCheck: true,
    port: process.env.DEV_SERVER_PORT || 8080,
    proxy: {
      '^/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/',
        },
      },
    },
  },
  pwa: {
    name: 'YesPlayMusic',
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
    },
    themeColor: '#ffffff00',
    manifestOptions: {
      background_color: '#335eea',
    },
    // workboxOptions: {
    //   swSrc: "dev/sw.js",
    // },
  },
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'YesPlayMusic',
      chunks: ['main', 'chunk-vendors', 'chunk-common', 'index'],
    },
  },
  chainWebpack(config) {
    config.module.rules.delete('svg');
    config.module.rule('svg').exclude.add(resolve('src/assets/icons')).end();
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/assets/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })
      .end();
    config.module
      .rule('napi')
      .test(/\.node$/)
      .use('node-loader')
      .loader('node-loader')
      .end();

    config.module
      .rule('webpack4_es_fallback')
      .test(/\.js$/)
      .include.add(/node_modules/)
      .end()
      .use('esbuild-loader')
      .loader('esbuild-loader')
      .options({ target: 'es2015', format: "cjs" })
      .end();

    // LimitChunkCountPlugin 可以通过合并块来对块进行后期处理。用以解决 chunk 包太多的问题
    config.plugin('chunkPlugin').use(webpack.optimize.LimitChunkCountPlugin, [
      {
        maxChunks: 3,
        minChunkSize: 10_000,
      },
    ]);
  },
  // 添加插件的配置
  pluginOptions: {
    // electron-builder的配置文件
    electronBuilder: {
      nodeIntegration: true,
      externals: ['@unblockneteasemusic/rust-napi'],
      builderOptions: {
        productName: 'YesPlayMusic',
        copyright: 'Copyright © YesPlayMusic',
        // compression: "maximum", // 机器好的可以打开，配置压缩，开启后会让 .AppImage 格式的客户端启动缓慢
        asar: true,
        publish: [
          {
            provider: 'github',
            owner: 'qier222',
            repo: 'YesPlayMusic',
            vPrefixedTagName: true,
            releaseType: 'draft',
          },
        ],
        directories: {
          output: 'dist_electron',
        },
        mac: buildTargets.mac,
        win: buildTargets.win,
        linux: buildTargets.linux,
        dmg: {
          icon: 'build/icons/icon.icns',
        },
        nsis: {
          oneClick: true,
          perMachine: true,
          deleteAppDataOnUninstall: true,
        },
        msi: {
          oneClick: false,
          perMachine: true,
          warningsAsErrors: false,
        },
      },
      // 主线程的配置文件
      chainWebpackMainProcess: config => {
        config.plugin('define').tap(args => {
          args[0]['IS_ELECTRON'] = true;
          return args;
        });
        config.resolve.alias.set(
          'jsbi',
          path.join(__dirname, 'node_modules/jsbi/dist/jsbi-cjs.js')
        );

        config.module
          .rule('webpack4_es_fallback')
          .test(/\.js$/)
          .include.add(/node_modules/)
          .end()
          .use('esbuild-loader')
          .loader('esbuild-loader')
          .options({ target: 'es2015', format: "cjs" })
          .end();
      },
      // 渲染线程的配置文件
      chainWebpackRendererProcess: config => {
        // 渲染线程的一些其他配置
        // Chain webpack config for electron renderer process only
        // The following example will set IS_ELECTRON to true in your app
        config.plugin('define').tap(args => {
          args[0]['IS_ELECTRON'] = true;
          return args;
        });
      },
      // 主入口文件
      // mainProcessFile: 'src/main.js',
      // mainProcessArgs: []
    },
  },
};
