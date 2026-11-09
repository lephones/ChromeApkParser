/**
 * Android 权限中英双语字典与危险级别
 */

export const PERMISSIONS_DATA = {
  // 危险敏感权限
  "android.permission.CAMERA": {
    nameZh: "拍摄照片和录制视频",
    descZh: "允许应用使用相机拍摄照片和录制视频，可能随时被应用调用",
    nameEn: "Take pictures and videos",
    descEn: "Allows app to take pictures and record videos with the camera",
    level: "dangerous"
  },
  "android.permission.RECORD_AUDIO": {
    nameZh: "录制音频",
    descZh: "允许应用访问麦克风进行录音",
    nameEn: "Record audio",
    descEn: "Allows app to access microphone and record audio",
    level: "dangerous"
  },
  "android.permission.ACCESS_FINE_LOCATION": {
    nameZh: "获取精确位置",
    descZh: "允许应用通过 GPS、基站或 Wi-Fi 获取设备的精确定位",
    nameEn: "Access precise location",
    descEn: "Allows app to access precise location from GPS, cellular and Wi-Fi",
    level: "dangerous"
  },
  "android.permission.ACCESS_COARSE_LOCATION": {
    nameZh: "获取大致位置",
    descZh: "允许应用通过网络源获取大致位置",
    nameEn: "Access approximate location",
    descEn: "Allows app to access approximate location using network sources",
    level: "dangerous"
  },
  "android.permission.READ_CONTACTS": {
    nameZh: "读取通讯录",
    descZh: "允许应用读取设备上存储的所有联系人信息",
    nameEn: "Read contacts",
    descEn: "Allows app to read all contacts stored on the device",
    level: "dangerous"
  },
  "android.permission.WRITE_CONTACTS": {
    nameZh: "修改通讯录",
    descZh: "允许应用添加、修改或删除设备上的联系人数据",
    nameEn: "Modify contacts",
    descEn: "Allows app to modify or delete contacts stored on the device",
    level: "dangerous"
  },
  "android.permission.READ_CALL_LOG": {
    nameZh: "读取通话记录",
    descZh: "允许应用读取用户的通话记录敏感信息",
    nameEn: "Read call log",
    descEn: "Allows app to read device's call log history",
    level: "dangerous"
  },
  "android.permission.WRITE_CALL_LOG": {
    nameZh: "写入通话记录",
    descZh: "允许应用修改手机通话记录",
    nameEn: "Write call log",
    descEn: "Allows app to modify device's call log history",
    level: "dangerous"
  },
  "android.permission.READ_PHONE_STATE": {
    nameZh: "读取电话状态和身份",
    descZh: "允许应用访问设备的电话功能，获取 IMEI/IMSI 及网络状态",
    nameEn: "Read phone status and identity",
    descEn: "Allows app to access phone features and network device IDs",
    level: "dangerous"
  },
  "android.permission.CALL_PHONE": {
    nameZh: "直接拨打电话",
    descZh: "允许应用在无需用户干预的情况下发起电话呼叫",
    nameEn: "Directly call phone numbers",
    descEn: "Allows app to initiate phone calls without user confirmation",
    level: "dangerous"
  },
  "android.permission.READ_SMS": {
    nameZh: "读取短信/彩信",
    descZh: "允许应用读取设备上存储的短信和验证码",
    nameEn: "Read SMS messages",
    descEn: "Allows app to read SMS messages stored on the device",
    level: "dangerous"
  },
  "android.permission.SEND_SMS": {
    nameZh: "发送短信",
    descZh: "允许应用发送短信，可能产生资费",
    nameEn: "Send SMS messages",
    descEn: "Allows app to send SMS messages which may incur charges",
    level: "dangerous"
  },
  "android.permission.RECEIVE_SMS": {
    nameZh: "接收短信",
    descZh: "允许应用监控并处理接收到的短信（包括验证码拦截）",
    nameEn: "Receive SMS messages",
    descEn: "Allows app to monitor and process incoming SMS messages",
    level: "dangerous"
  },
  "android.permission.READ_EXTERNAL_STORAGE": {
    nameZh: "读取外部存储空间",
    descZh: "允许应用读取 SD 卡或共享存储中的文件、照片与视频",
    nameEn: "Read external storage",
    descEn: "Allows app to read files, photos and videos from shared storage",
    level: "dangerous"
  },
  "android.permission.WRITE_EXTERNAL_STORAGE": {
    nameZh: "写入外部存储空间",
    descZh: "允许应用修改或删除 SD 卡或共享存储中的文件",
    nameEn: "Write external storage",
    descEn: "Allows app to modify or delete files in shared storage",
    level: "dangerous"
  },
  "android.permission.MANAGE_EXTERNAL_STORAGE": {
    nameZh: "所有文件访问权限",
    descZh: "Android 11+ 特殊权限，允许应用访问所有公共存储文件",
    nameEn: "All files access permission",
    descEn: "Allows broad access to shared storage on Android 11+",
    level: "dangerous"
  },

  // 特殊权限
  "android.permission.SYSTEM_ALERT_WINDOW": {
    nameZh: "显示在其他应用上层（悬浮窗）",
    descZh: "允许应用创建覆盖在其他应用之上的窗口",
    nameEn: "Display over other apps",
    descEn: "Allows app to create overlay windows above all other apps",
    level: "special"
  },
  "android.permission.REQUEST_INSTALL_PACKAGES": {
    nameZh: "请求安装应用包",
    descZh: "允许应用触发安装其他应用或更新",
    nameEn: "Request install packages",
    descEn: "Allows app to trigger installation of APK packages",
    level: "special"
  },
  "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS": {
    nameZh: "忽略电池优化",
    descZh: "允许应用常驻后台运行，不受系统省电策略限制",
    nameEn: "Ignore battery optimizations",
    descEn: "Allows app to run continuously in background without battery limits",
    level: "special"
  },

  // 普通权限
  "android.permission.INTERNET": {
    nameZh: "拥有完全网络访问权限",
    descZh: "允许应用创建网络套接字并访问互联网",
    nameEn: "Full network access",
    descEn: "Allows app to create network sockets and use custom network protocols",
    level: "normal"
  },
  "android.permission.ACCESS_NETWORK_STATE": {
    nameZh: "查看网络状态",
    descZh: "允许应用查看网络连接是否存在或类型（Wi-Fi/移动数据）",
    nameEn: "View network connections",
    descEn: "Allows app to view network connectivity state",
    level: "normal"
  },
  "android.permission.ACCESS_WIFI_STATE": {
    nameZh: "查看 Wi-Fi 状态",
    descZh: "允许应用查看有关 Wi-Fi 网络的信息",
    nameEn: "View Wi-Fi connections",
    descEn: "Allows app to view information about Wi-Fi networking",
    level: "normal"
  },
  "android.permission.CHANGE_WIFI_STATE": {
    nameZh: "更改 Wi-Fi 状态",
    descZh: "允许应用连接/断开 Wi-Fi 接入点",
    nameEn: "Connect and disconnect from Wi-Fi",
    descEn: "Allows app to connect to and disconnect from Wi-Fi networks",
    level: "normal"
  },
  "android.permission.VIBRATE": {
    nameZh: "控制设备振动",
    descZh: "允许应用控制设备振动器",
    nameEn: "Control vibration",
    descEn: "Allows app to control device vibrator",
    level: "normal"
  },
  "android.permission.WAKE_LOCK": {
    nameZh: "防止手机休眠",
    descZh: "允许应用防止手机进入休眠状态",
    nameEn: "Prevent device from sleeping",
    descEn: "Allows app to keep processor from sleeping or screen from dimming",
    level: "normal"
  },
  "android.permission.BLUETOOTH": {
    nameZh: "连接蓝牙设备",
    descZh: "允许应用查看蓝牙配置并与配对的设备建立连接",
    nameEn: "Pair with Bluetooth devices",
    descEn: "Allows app to connect to paired Bluetooth devices",
    level: "normal"
  },
  "android.permission.FOREGROUND_SERVICE": {
    nameZh: "前台服务运行",
    descZh: "允许应用启动带有通知栏提醒的前台服务",
    nameEn: "Run foreground service",
    descEn: "Allows app to run foreground services with active notification",
    level: "normal"
  },
  "android.permission.POST_NOTIFICATIONS": {
    nameZh: "发送通知",
    descZh: "Android 13+ 允许应用向用户推送通知",
    nameEn: "Post notifications",
    descEn: "Allows app to display notifications on Android 13+",
    level: "normal"
  }
};

/**
 * 格式化并丰富权限信息（支持语言适配）
 * @param {string} permissionString
 * @param {'zh'|'en'} lang
 */
export function enrichPermission(permissionString, lang = "zh") {
  const shortName = permissionString.split(".").pop();
  const info = PERMISSIONS_DATA[permissionString];

  if (info) {
    const isEn = lang === "en";
    return {
      raw: permissionString,
      shortName,
      title: isEn ? info.nameEn : info.nameZh,
      description: isEn ? info.descEn : info.descZh,
      level: info.level
    };
  }

  let level = "normal";
  if (
    permissionString.includes("LOCATION") ||
    permissionString.includes("CAMERA") ||
    permissionString.includes("AUDIO") ||
    permissionString.includes("CONTACTS") ||
    permissionString.includes("STORAGE") ||
    permissionString.includes("SMS") ||
    permissionString.includes("PHONE")
  ) {
    level = "dangerous";
  }

  return {
    raw: permissionString,
    shortName,
    title: shortName,
    description: lang === "en" ? "Standard Android System Permission" : "Android 系统权限",
    level
  };
}
