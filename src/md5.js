// MD5算法相关函数
const crypto = require('crypto');

function md5(string) {
    return crypto
      .createHash('md5')
      .update(string)
      .digest('hex');
  }
  
  // 主函数：生成签名
  function s(input) {
    // 检查mkPlayer对象是否存在且包含version属性
    if (typeof mkPlayer === 'undefined' || mkPlayer === null || !('version' in mkPlayer)) {
      console.error('mkPlayer is null');
      return '';
    }
  
    // 确保输入是字符串
    input = String(input);
    
    // 获取播放器版本并处理
    const version = mkPlayer.version;
    
    // 处理版本号：确保每部分都是两位数
    const processedVersion = version.split('.').map(part => {
      return part.length === 1 ? '0' + part : part;
    }).join('');
    
    // 创建版本号的逆序字符串
    const reversedVersion = processedVersion.split('').reverse().join('');
    
    // 构建待哈希的字符串
    const stringToHash = processedVersion + 's' + input + 's' + reversedVersion;
    
    // 计算MD5哈希
    const md5Result = md5(stringToHash);
    
    // 取最后8个字符并转为大写
    const finalSignature = md5Result.slice(-8).toUpperCase();
    
    return finalSignature;
  }

  module.exports = s;
  