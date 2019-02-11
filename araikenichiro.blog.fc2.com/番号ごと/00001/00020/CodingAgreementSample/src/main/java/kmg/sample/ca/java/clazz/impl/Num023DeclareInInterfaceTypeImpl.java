/**
 *
 */
package kmg.sample.ca.java.clazz.impl;

import java.time.LocalDate;

import kmg.sample.ca.java.clazz.Num023DeclareInInterfaceType;

/**
 * 番号023：インタフェースの型で宣言する
 *
 * @author KenichiroArai
 */
public class Num023DeclareInInterfaceTypeImpl implements Num023DeclareInInterfaceType {

    /**
     * {@inheritDoc}
     */
    @Override
    public LocalDate getNow() {

        final LocalDate result = LocalDate.now();
        return result;
    }

    /**
     * エントリポイント
     *
     * @param args
     *                 引数
     */
    public static void main(final String[] args) {

        final Num023DeclareInInterfaceType proc = new Num023DeclareInInterfaceTypeImpl();       // インタフェースの型で宣言する。
        System.out.println(proc.getNow());
    }

}
