import styles from './Loading.module.css'

export default function Loading({ size = 'medium', text, inline = false, overlay = false }) {
    if (inline) {
        return <span className={`${styles.spinner} ${styles[size]}`} />
    }

    if (overlay) {
        return (
            <div className={styles.overlay}>
                <div className={styles.overlayBox}>
                    <span className={`${styles.spinner} ${styles[size]}`} />
                    {text && <p className={styles.text}>{text}</p>}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <span className={`${styles.spinner} ${styles[size]}`} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    )
}
