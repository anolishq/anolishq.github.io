# Hardware support

Which devices each hardware provider accepts, and which of them have run on
real hardware. The device type is the `devices[].type` value in the
provider's config.

| Status | Meaning |
|---|---|
| tested | Run on real hardware, driven by the runtime through the provider. The row gives the provider release, the date, and what was run. |
| supported | Accepted by a provider release and covered by its own tests, not run on hardware. |
| in progress | Not in a provider release yet. The row links the issue. |

A tested row records the most recent hardware run; the release in it shows
how old that run is.

## BREAD boards

[anolis-provider-bread](/repos/anolis-provider-bread/)

| Device | Type | Status | Detail |
|---|---|---|---|
| RLHT heater | `rlht` | tested | 0.12.0, 2026-11-11: closed-loop heat, e-stop, safe-state re-assert |
| DCMT motor | `dcmt` | tested | 0.12.0, 2026-11-11: open-loop drive, brake, e-stop, safe-state re-assert. The closed-loop modes need motor encoders and have not run on hardware. |

## Atlas Scientific EZO circuits

[anolis-provider-ezo](/repos/anolis-provider-ezo/)

| Device | Type | Status | Detail |
|---|---|---|---|
| pH | `ph` | tested | 0.7.0, 2026-11-11: reads and `set_compensation`. 3-point calibration on 0.5.1, 2026-11-02. |
| Dissolved oxygen | `do` | tested | 0.7.0, 2026-11-11: reads and `set_compensation`. Calibration on 0.6.0, 2026-11-09. |
| ORP | `orp` | supported | |
| Conductivity | `ec` | supported | |
| RTD temperature | `rtd` | supported | |
| Humidity | `hum` | supported | |
| CO2 | `co2` | in progress | [anolis-provider-ezo#178](https://github.com/anolishq/anolis-provider-ezo/issues/178) |
| Oxygen | `o2` | in progress | [anolis-provider-ezo#178](https://github.com/anolishq/anolis-provider-ezo/issues/178) |

## Adafruit boards

[anolis-provider-adafruit](https://github.com/anolishq/anolis-provider-adafruit)

| Device | Type | Status | Detail |
|---|---|---|---|
| BME280 temperature, humidity and pressure | `bme280` | tested | 0.3.0, 2026-11-11 |
| SHT3x temperature and humidity | `sht3x` | tested | 0.3.0, 2026-11-09, on an SHT31-D |
| LPS22 pressure | `lps22` | tested | 0.3.0, 2026-11-09 |
| BMP3xx pressure | `bmp3xx` | tested | 0.3.0, 2026-11-09, on a BMP390 |
| MPU-6050 accelerometer and gyroscope | `mpu6050` | tested | 0.3.0, 2026-11-09 |
| DC & Stepper Motor HAT | `motor_hat` | supported | |
| SHT4x temperature and humidity | `sht4x` | supported | |
| SHTC3 temperature and humidity | `shtc3` | supported | |

## SparkFun Qwiic boards

[anolis-provider-sparkfun](https://github.com/anolishq/anolis-provider-sparkfun)

| Device | Type | Status | Detail |
|---|---|---|---|
| Qwiic Motor Driver (SCMD) | `scmd` | supported | |
| ADS1015 analog inputs | `ads1015` | supported | |
| BME280 temperature, humidity and pressure | `bme280` | supported | |
| SCD4x CO2 | `scd4x` | supported | |
| SHT4x temperature and humidity | `sht4x` | supported | |
| SHTC3 temperature and humidity | `shtc3` | supported | |

The Adafruit and SparkFun providers list the boards they could support next in
their `docs/coverage.md`.
