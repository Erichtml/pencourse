import { BasePage } from './base-page.js'
class App extends $falcon.App {
  /**
   * 构造函数,应用生命周期内只构造一次
   */
  constructor() {
    super()
  }

  /**
   * 应用生命周期:应用启动. 初始化完成时回调,全局只触发一次.
   * @param {Object} options 启动参数
   */
  onLaunch(options) {
    super.onLaunch(options)

    // 按真机参数写死分辨率适配，不再动态读取 bridge
    // 设备参数：screen.width=960, screen.height=266, direction=270
    const renderWidth = 960;
    const renderHeight = 266;
    const screenWidth = 960;
    const screenHeight = 266;
    const designWidth = 960;

    this.setViewPort(designWidth);

    // 将屏幕信息保存到应用实例，供页面按需读取
    this.screenInfo = {
      renderWidth,
      renderHeight,
      screenWidth,
      screenHeight,
      designWidth
    };
    console.log('screenInfo (hardcoded):', JSON.stringify(this.screenInfo));

    // 设置页面基类,应用全局的$falcon.Page将被替换成此处指定的BasePage.
    // 继承自$falcon.Page的页面将继承自改基类.
    // 如页面未指定js,直接指向.vue文件,页面创建时会默认创建该类的实例
    $falcon.useDefaultBasePageClass(BasePage)
  }

  /**
   * 应用生命周期,应用启动或应用从后台切换到前台时触发
   */
  onShow() {
    super.onShow()
  }

  /**
   * 应用生命周期:应用退出前或者应用从前台切换到后台时触发
   */
  onHide() {
    super.onHide()
  }

  /**
   * 应用生命周期:应用销毁前触发
   */
  onDestroy() {
    super.onDestroy()
  }
}

try {
  globalThis['window'] = {
    requestAnimationFrame,
    cancelAnimationFrame
  }
} catch (err) {
  console.log(err)
}

try {
  globalThis['process'] = {
    env: {
      NODE_ENV: 'production'
    }
  }
} catch (err) {
  console.log(err)
}

export default App
