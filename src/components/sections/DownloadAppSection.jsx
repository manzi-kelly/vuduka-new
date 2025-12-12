import React from 'react';
import { FaCar } from 'react-icons/fa';

function DownloadAppSection() {
  return (
    <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-10 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
                <p className="mb-6 opacity-90">Get the best experience with our mobile app. Book rides faster, track drivers in real-time, and enjoy exclusive offers.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium flex items-center transition duration-300">
                    <div className="mr-3">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-left">Download on the</div>
                      <div className="font-bold text-lg">App Store</div>
                    </div>
                  </button>
                  <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium flex items-center transition duration-300">
                    <div className="mr-3">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1.571 23.664c.267.043.537.075.811.094.58.041 1.17-.032 1.736-.227.197-.07.377-.172.54-.3.202-.153.365-.35.478-.578.134-.272.2-.57.193-.871-.007-.355-.081-.704-.219-1.03-.146-.345-.358-.658-.625-.92a2.05 2.05 0 0 0-.666-.447 2.143 2.143 0 0 0-1.08-.173c-.343.04-.67.165-.947.362-.235.17-.426.39-.56.643-.15.281-.224.596-.217.915.005.314.078.623.215.905.117.25.285.473.492.654.19.164.41.29.648.37.232.078.476.107.721.085zM6.695 19.96c.09.04.183.074.28.101.437.123.894.137 1.338.04.177-.039.348-.104.506-.194.22-.124.4-.307.52-.526.138-.25.21-.533.206-.82-.005-.338-.085-.669-.236-.968-.16-.32-.4-.6-.698-.816a2.01 2.01 0 0 0-.787-.373 2.1 2.1 0 0 0-1.008.031c-.316.09-.6.265-.824.504-.196.207-.34.46-.42.738-.09.31-.107.638-.05.96.05.3.173.583.357.826.163.215.37.394.608.522.205.113.436.19.674.224zM4.017 11.354c.063.13.14.252.23.367.344.445.82.768 1.348.92.186.053.378.086.572.096.5.026.998-.09 1.433-.33.25-.137.468-.326.636-.554.19-.262.31-.568.347-.886.031-.297-.025-.596-.163-.865-.118-.23-.294-.428-.51-.575a1.92 1.92 0 0 0-.719-.316 2.1 2.1 0 0 0-1.02.03c-.33.094-.62.282-.838.538-.195.226-.33.5-.392.79-.056.26-.038.528.052.78.07.189.178.363.308.515zM12.816 21.356c.136.226.3.43.488.61.53.51 1.2.81 1.908.85.196.01.393-.01.587-.06.528-.135.98-.47 1.275-.937.17-.265.28-.568.32-.883.03-.3-.03-.602-.172-.87-.12-.24-.31-.44-.54-.58a1.93 1.93 0 0 0-.76-.28 2.1 2.1 0 0 0-1.02.1c-.32.1-.6.29-.8.55-.18.23-.3.5-.35.79-.05.26-.02.53.08.78.08.2.2.38.35.53zM10.483 12.735c.16.39.45.71.82.91.13.07.27.13.42.17.42.11.87.07 1.27-.12.22-.1.41-.26.55-.46.15-.22.24-.48.26-.75.01-.28-.06-.56-.19-.8-.12-.24-.32-.43-.56-.56a1.83 1.83 0 0 0-.79-.2c-.35.02-.68.15-.95.37-.24.19-.42.45-.51.75-.08.28-.07.58.03.86.07.2.19.38.33.53z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-left">GET IT ON</div>
                      <div className="font-bold text-lg">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="bg-white bg-opacity-20 rounded-xl w-64 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <FaCar className="text-white text-6xl mx-auto mb-4" />
                      <p className="font-bold text-xl">Vuduka App</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  );
}

export default DownloadAppSection;